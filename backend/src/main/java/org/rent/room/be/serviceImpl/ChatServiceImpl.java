package org.rent.room.be.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.MessageStatus;
import org.rent.room.be.dto.request.chat.MessageRequest;
import org.rent.room.be.dto.response.chat.ConversationResponse;
import org.rent.room.be.dto.response.chat.MessageResponse;
import org.rent.room.be.dto.response.chat.ReadReceiptResponse;
import org.rent.room.be.entity.Conversation;
import org.rent.room.be.entity.Message;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.ChatMapper;
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
    private final ChatMapper chatMapper;
    private final UserService userService;
    private final UploadService uploadService;

    @Transactional
    @Override
    public void saveMessage(MessageRequest request, UUID currentUserId) {
        if (currentUserId.equals(request.getRecipientId())) {
            throw new RuntimeException("Cannot send message to yourself");
        }

        User sender = userService.findByUserId(currentUserId);
        User recipient = userService.findByUserId(request.getRecipientId());
        Conversation conversation = getOrCreateConversation(sender, recipient);

        Message newMessage = Message.builder()
                .messageBody(request.getContent())
                .sender(sender)
                .recipient(recipient)
                .conversation(conversation)
                .status(MessageStatus.SENT)
                .createdAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(newMessage);
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
    public List<MessageResponse> getMessagesByConversation(UUID conversationId) {
        if (!conversationRepository.existsById(conversationId)) {
            throw new RuntimeException("Conversation not found");
        }

        return messageRepository.findByConversationConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(chatMapper::toMessageResponse)
                .toList();
    }

    @Override
    public ConversationResponse getConversationById(UUID conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
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
        User recipient = userService.findByUserId(request.getRecipientId());

        if (sender.getUserId().equals(recipient.getUserId())) {
            throw new RuntimeException("Cannot send message to yourself");
        }

        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            Map<?, ?> uploadResult = uploadService.uploadImage(file);
            imageUrl = uploadResult.get("secure_url").toString();
        }

        Conversation conversation = getOrCreateConversation(sender, recipient);

        Message newMessage = Message.builder()
                .messageBody(request.getContent())
                .imageUrl(imageUrl)
                .sender(sender)
                .recipient(recipient)
                .conversation(conversation)
                .status(MessageStatus.SENT)
                .createdAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(newMessage);
        MessageResponse response = chatMapper.toMessageResponse(saved);

        broadcastMessage(response, sender.getEmail(), recipient.getEmail());

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

    private Conversation getOrCreateConversation(User sender, User recipient) {
        Conversation conversation = conversationRepository
                .findBetweenUsers(sender.getUserId(), recipient.getUserId())
                .orElseGet(() -> {
                    boolean senderIsUser1 = sender.getUserId().compareTo(recipient.getUserId()) < 0;
                    return Conversation.builder()
                            .user1(senderIsUser1 ? sender : recipient)
                            .user2(senderIsUser1 ? recipient : sender)
                            .conversationTitle(sender.getUserName() + " & " + recipient.getUserName())
                            .createdAt(LocalDateTime.now())
                            .build();
                });

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

    private ConversationResponse toConversationResponseWithPreview(Conversation conversation) {
        ConversationResponse response = chatMapper.toConversationResponse(conversation);

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

