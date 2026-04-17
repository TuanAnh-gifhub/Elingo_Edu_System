package org.rent.room.be.dto.response.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.rent.room.be.constant.ConversationType;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConversationResponse {

    UUID conversationId;

    String conversationTitle;

    ConversationType conversationType;

    UUID classId;

    String lastMessage;

    String lastSenderName;

    UserChatResponse user1;

    UserChatResponse user2;

    LocalDateTime updatedAt;
}

