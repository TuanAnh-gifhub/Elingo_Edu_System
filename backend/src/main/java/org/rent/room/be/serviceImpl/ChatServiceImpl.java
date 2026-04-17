package org.rent.room.be.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.ConversationType;
import org.rent.room.be.constant.MessageStatus;
import org.rent.room.be.dto.request.chat.MessageRequest;
import org.rent.room.be.dto.response.chat.ConversationResponse;
import org.rent.room.be.dto.response.chat.MessageResponse;
import org.rent.room.be.dto.response.chat.ReadReceiptResponse;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Conversation;
import org.rent.room.be.entity.Message;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.ChatMapper;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.ConversationRepository;
import org.rent.room.be.repository.MessageRepository;
import org.rent.room.be.service.ChatService;
import org.rent.room.be.service.UploadService;
import org.rent.room.be.service.UserService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ClassRoomRepository classRoomRepository;
    private final ChatMapper chatMapper;
    private final UserService userService;
    private final UploadService uploadService;

    @Transactional
    @Override
    public void saveMessage(MessageRequest request, UUID currentUserId) {
        User sender = userService.findByUserId(currentUserId);
        Conversation conversation = resolveConversationForSending(request, sender);

        if (conversation.getConversationType() == ConversationType.CLASS_GROUP) {
            Message saved = buildAndSaveMessage(request.getContent(), null, sender, null, conversation);
            broadcastMessageToConversation(chatMapper.toMessageResponse(saved), conversation);
            return;
        }

        User recipient = resolveDirectRecipient(request, sender, conversation);
        Message saved = buildAndSaveMessage(request.getContent(), null, sender, recipient, conversation);
        broadcastMessage(chatMapper.toMessageResponse(saved), sender.getEmail(), recipient.getEmail());
    }

    @Override
    public List<ConversationResponse> getUserConversations(UUID userId) {
        return conversationRepository
                .findVisibleConversationsByUserId(userId)
                .stream()
                .map(this::toConversationResponseWithPreview)
                .toList();
    }

    @Override
    public List<MessageResponse> getMessagesByConversation(UUID conversationId, UUID currentUserId) {
        conversationRepository.findByConversationIdAndParticipant(conversationId, currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));

        return messageRepository.findByConversationConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(chatMapper::toMessageResponse)
                .toList();
    }

    @Override
    public ConversationResponse getConversationById(UUID conversationId, UUID currentUserId) {
        Conversation conv = conversationRepository.findByConversationIdAndParticipant(conversationId, currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));
        return toConversationResponseWithPreview(conv);
    }

    @Override
    @Transactional
    public ConversationResponse getOrCreateDirectConversation(UUID currentUserId, UUID recipientId) {
        if (currentUserId.equals(recipientId)) {
            throw new RuntimeException("Cannot create conversation with yourself");
        }

        User sender = userService.findByUserId(currentUserId);
        User recipient = userService.findByUserId(recipientId);
        Conversation conversation = getOrCreateConversation(sender, recipient);
        return toConversationResponseWithPreview(conversation);
    }

    @Transactional
    @Override
    public void markAllMessagesInConversationAsRead(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository.findByConversationIdAndParticipant(conversationId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));

        if (conversation.getConversationType() == ConversationType.CLASS_GROUP) {
            return;
        }

        List<Message> unreadMessages = messageRepository
                .findByConversationConversationIdAndRecipientUserIdAndStatusNot(conversationId, userId, MessageStatus.READ);

        if (unreadMessages.isEmpty()) {
            return;
        }

        unreadMessages.forEach(msg -> {
            msg.setStatus(MessageStatus.READ);
            msg.setReadAt(LocalDateTime.now());
        });
        messageRepository.saveAll(unreadMessages);

        String originalSenderEmail = unreadMessages.getFirst().getSender().getEmail();
        messagingTemplate.convertAndSendToUser(
                originalSenderEmail,
                "/queue/read-receipt",
                new ReadReceiptResponse(conversationId, userId)
        );
    }

    @Transactional
    @Override
    public MessageResponse saveMessageWithFile(MessageRequest request, UUID currentUserId, MultipartFile file) throws IOException {
        User sender = userService.findByUserId(currentUserId);
        Conversation conversation = resolveConversationForSending(request, sender);

        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            Map<?, ?> uploadResult = uploadService.uploadImage(file);
            imageUrl = uploadResult.get("secure_url").toString();
        }

        User recipient = null;
        if (conversation.getConversationType() == ConversationType.DIRECT) {
            recipient = resolveDirectRecipient(request, sender, conversation);
        }

        Message saved = buildAndSaveMessage(request.getContent(), imageUrl, sender, recipient, conversation);
        MessageResponse response = chatMapper.toMessageResponse(saved);

        if (conversation.getConversationType() == ConversationType.CLASS_GROUP) {
            broadcastMessageToConversation(response, conversation);
        } else {
            broadcastMessage(response, sender.getEmail(), recipient.getEmail());
        }

        return response;
    }

    @Override
    @Transactional
    public void deleteConversationForCurrentUser(UUID conversationId, UUID currentUserId) {
        Conversation conversation = conversationRepository
                .findByConversationIdAndParticipant(conversationId, currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));

        Set<UUID> hiddenByUserIds = conversation.getHiddenByUserIds();
        hiddenByUserIds.add(currentUserId);
        conversation.setHiddenByUserIds(hiddenByUserIds);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    @Override
    @Transactional
    public void createClassGroupConversation(UUID classId, String className, UUID teacherId) {
        Conversation existing = conversationRepository
                .findByClassRoom_ClassIdAndConversationType(classId, ConversationType.CLASS_GROUP)
                .orElse(null);

        if (existing != null) {
            if (existing.getParticipantUserIds() == null) {
                existing.setParticipantUserIds(new HashSet<>());
            }
            existing.getParticipantUserIds().add(teacherId);
            existing.getHiddenByUserIds().remove(teacherId);
            if (className != null && !className.isBlank()) {
                existing.setConversationTitle(className.trim());
            }
            existing.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(existing);
            return;
        }

        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        User teacher = userService.findByUserId(teacherId);

        Conversation groupConversation = Conversation.builder()
                .conversationTitle((className == null || className.isBlank()) ? "Lop hoc" : className.trim())
                .conversationType(ConversationType.CLASS_GROUP)
                .classRoom(classRoom)
                .user1(teacher)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        groupConversation.getParticipantUserIds().add(teacherId);

        conversationRepository.save(groupConversation);
    }

    @Override
    @Transactional
    public void joinUserToClassGroupConversation(UUID classId, UUID userId) {
        Conversation conversation = conversationRepository
                .findByClassRoom_ClassIdAndConversationType(classId, ConversationType.CLASS_GROUP)
                .orElseGet(() -> {
                    ClassRoom classRoom = classRoomRepository.findById(classId)
                            .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
                    User teacher = classRoom.getTeacher();
                    if (teacher == null || teacher.getUserId() == null) {
                        throw new AppException(ErrorCode.FORBIDDEN);
                    }

                    Conversation created = Conversation.builder()
                            .conversationTitle(classRoom.getClassName())
                            .conversationType(ConversationType.CLASS_GROUP)
                            .classRoom(classRoom)
                            .user1(teacher)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    created.getParticipantUserIds().add(teacher.getUserId());
                    return created;
                });

        if (conversation.getParticipantUserIds() == null) {
            conversation.setParticipantUserIds(new HashSet<>());
        }
        conversation.getParticipantUserIds().add(userId);
        conversation.getHiddenByUserIds().remove(userId);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    @Override
    @Transactional
    public void deleteClassGroupConversation(UUID classId) {
        conversationRepository.deleteByClassRoom_ClassIdAndConversationType(classId, ConversationType.CLASS_GROUP);
    }

    private Conversation getOrCreateConversation(User sender, User recipient) {
        Conversation conversation = conversationRepository
                .findBetweenUsers(sender.getUserId(), recipient.getUserId())
                .orElseGet(() -> {
                    boolean senderIsUser1 = sender.getUserId().compareTo(recipient.getUserId()) < 0;
                    return Conversation.builder()
                            .user1(senderIsUser1 ? sender : recipient)
                            .user2(senderIsUser1 ? recipient : sender)
                            .conversationType(ConversationType.DIRECT)
                            .conversationTitle(sender.getUserName() + " & " + recipient.getUserName())
                            .createdAt(LocalDateTime.now())
                            .build();
                });

        if (conversation.getConversationType() == null) {
            conversation.setConversationType(ConversationType.DIRECT);
        }

        if (conversation.getParticipantUserIds() == null) {
            conversation.setParticipantUserIds(new HashSet<>());
        }
        conversation.getParticipantUserIds().add(sender.getUserId());
        conversation.getParticipantUserIds().add(recipient.getUserId());

        if (conversation.getHiddenByUserIds() != null) {
            conversation.getHiddenByUserIds().remove(sender.getUserId());
            conversation.getHiddenByUserIds().remove(recipient.getUserId());
        }
        conversation.setUpdatedAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }

    private void broadcastMessage(MessageResponse response, String senderPrincipalName, String recipientPrincipalName) {
        messagingTemplate.convertAndSendToUser(
                recipientPrincipalName,
                "/queue/messages",
                response
        );

        messagingTemplate.convertAndSendToUser(
                senderPrincipalName,
                "/queue/messages",
                response
        );
    }

    private void broadcastMessageToConversation(MessageResponse response, Conversation conversation) {
        Set<UUID> participantIds = conversation.getParticipantUserIds();
        if (participantIds == null || participantIds.isEmpty()) {
            return;
        }

        for (UUID participantId : participantIds) {
            User participant = userService.findByUserId(participantId);
            messagingTemplate.convertAndSendToUser(
                    participant.getEmail(),
                    "/queue/messages",
                    response
            );
        }
    }

    private Conversation resolveConversationForSending(MessageRequest request, User sender) {
        if (request.getConversationId() != null) {
            Conversation conversation = conversationRepository
                    .findByConversationIdAndParticipant(request.getConversationId(), sender.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.FORBIDDEN));

            conversation.getHiddenByUserIds().remove(sender.getUserId());
            conversation.setUpdatedAt(LocalDateTime.now());
            return conversationRepository.save(conversation);
        }

        if (request.getRecipientId() == null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        if (sender.getUserId().equals(request.getRecipientId())) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        User recipient = userService.findByUserId(request.getRecipientId());
        return getOrCreateConversation(sender, recipient);
    }

    private User resolveDirectRecipient(MessageRequest request, User sender, Conversation conversation) {
        UUID recipientId = request.getRecipientId();
        if (recipientId != null) {
            if (sender.getUserId().equals(recipientId)) {
                throw new AppException(ErrorCode.INVALID_KEY);
            }

            if (conversation.getUser1() == null || conversation.getUser2() == null) {
                throw new AppException(ErrorCode.INVALID_KEY);
            }

            UUID user1Id = conversation.getUser1().getUserId();
            UUID user2Id = conversation.getUser2().getUserId();
            boolean senderInConversation = sender.getUserId().equals(user1Id) || sender.getUserId().equals(user2Id);
            boolean recipientInConversation = recipientId.equals(user1Id) || recipientId.equals(user2Id);

            if (!senderInConversation || !recipientInConversation) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }

            return userService.findByUserId(recipientId);
        }

        if (conversation.getUser1() == null || conversation.getUser2() == null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        if (conversation.getUser1().getUserId().equals(sender.getUserId())) {
            return conversation.getUser2();
        }
        if (conversation.getUser2().getUserId().equals(sender.getUserId())) {
            return conversation.getUser1();
        }

        throw new AppException(ErrorCode.FORBIDDEN);
    }

    private Message buildAndSaveMessage(
            String content,
            String imageUrl,
            User sender,
            User recipient,
            Conversation conversation
    ) {
        Message newMessage = Message.builder()
                .messageBody(content)
                .imageUrl(imageUrl)
                .sender(sender)
                .recipient(recipient)
                .conversation(conversation)
                .status(MessageStatus.SENT)
                .createdAt(LocalDateTime.now())
                .build();

        return messageRepository.save(newMessage);
    }

    private ConversationResponse toConversationResponseWithPreview(Conversation conversation) {
        ConversationResponse response = chatMapper.toConversationResponse(conversation);

        if (response.getConversationType() == null) {
            response.setConversationType(ConversationType.DIRECT);
        }

        if ((response.getConversationTitle() == null || response.getConversationTitle().isBlank())
                && conversation.getClassRoom() != null
                && conversation.getClassRoom().getClassName() != null) {
            response.setConversationTitle(conversation.getClassRoom().getClassName());
        }

        Message previewMessage = messageRepository
                .findTopByConversationConversationIdOrderByCreatedAtDesc(conversation.getConversationId())
                .orElse(null);

        String preview = normalizeMessagePreview(previewMessage);

        if (preview == null) {
            // Fallback for legacy data where createdAt/order can be inconsistent.
            List<Message> history = messageRepository
                    .findByConversationConversationIdOrderByCreatedAtAsc(conversation.getConversationId());
            for (int index = history.size() - 1; index >= 0; index--) {
                Message candidate = history.get(index);
                String candidatePreview = normalizeMessagePreview(candidate);
                if (candidatePreview != null) {
                    preview = candidatePreview;
                    previewMessage = candidate;
                    break;
                }
            }
        }

        response.setLastMessage(preview);
        response.setLastSenderName(
                previewMessage != null && previewMessage.getSender() != null
                        ? previewMessage.getSender().getUserName()
                        : null
        );

        return response;
    }

    private String normalizeMessagePreview(Message message) {
        if (message == null) {
            return null;
        }

        String preview = message.getMessageBody();
        if (preview != null && !preview.isBlank()) {
            return preview;
        }

        if (message.getImageUrl() != null && !message.getImageUrl().isBlank()) {
            return "Đã gửi tệp đính kèm";
        }

        return null;
    }
}

