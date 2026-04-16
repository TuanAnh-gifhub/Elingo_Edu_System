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
        broadcastMessage(chatMapper.toMessageResponse(saved), sender.getUserId(), recipient.getUserId());
    }

    @Override
    public List<ConversationResponse> getUserConversations(UUID userId) {
        return conversationRepository
                .findAllByUser1UserIdOrUser2UserIdOrderByUpdatedAtDesc(userId, userId)
                .stream()
                .map(chatMapper::toConversationResponse)
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
        return chatMapper.toConversationResponse(conv);
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

        UUID originalSenderId = unreadMessages.getFirst().getSender().getUserId();
        messagingTemplate.convertAndSendToUser(
                originalSenderId.toString(),
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

        broadcastMessage(response, sender.getUserId(), recipient.getUserId());

        return response;
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

        conversation.setUpdatedAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }

    private void broadcastMessage(MessageResponse response, UUID senderId, UUID recipientId) {
        messagingTemplate.convertAndSendToUser(
                recipientId.toString(),
                "/queue/messages",
                response
        );

        messagingTemplate.convertAndSendToUser(
                senderId.toString(),
                "/queue/messages",
                response
        );
    }
}

