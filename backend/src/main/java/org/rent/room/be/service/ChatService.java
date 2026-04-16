package org.rent.room.be.service;

import jakarta.transaction.Transactional;
import org.rent.room.be.dto.request.chat.MessageRequest;
import org.rent.room.be.dto.response.chat.ConversationResponse;
import org.rent.room.be.dto.response.chat.MessageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public interface ChatService {

    void saveMessage(MessageRequest request, UUID currentUserId);

    List<ConversationResponse> getUserConversations(UUID userId);

    List<MessageResponse> getMessagesByConversation(UUID conversationId);

    ConversationResponse getConversationById(UUID conversationId);

    void markAllMessagesInConversationAsRead(UUID conversationId, UUID recipientId);

    @Transactional
    MessageResponse saveMessageWithFile(MessageRequest request, UUID currentUserId, MultipartFile file) throws IOException;
}

