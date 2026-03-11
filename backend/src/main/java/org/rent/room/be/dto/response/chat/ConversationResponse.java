package org.rent.room.be.dto.response.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConversationResponse {

    UUID conversationId;

    String conversationTitle;

    String lastMessage;

    String lastSenderName;

    UserChatResponse user1;

    UserChatResponse user2;

    LocalDateTime updatedAt;
}

