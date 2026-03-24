package org.rent.room.be.dto.response.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.rent.room.be.constant.MessageStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageResponse {

    UUID messageId;

    UUID conversationId;

    String content;

    String senderName;

    UUID senderId;

    LocalDateTime createdAt;

    MessageStatus status;

    LocalDateTime readAt;

    String imageUrl;
}

