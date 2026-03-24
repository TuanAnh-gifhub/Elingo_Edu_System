package org.rent.room.be.dto.response.chat;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class ReadReceiptResponse {

    UUID conversationId;

    UUID readerId;
}

