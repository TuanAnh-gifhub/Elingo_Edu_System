package org.rent.room.be.dto.response.chat;

import lombok.Data;

import java.util.UUID;

@Data
public class UserChatResponse {

    UUID userId;

    String userName;

    String avatar;
}

