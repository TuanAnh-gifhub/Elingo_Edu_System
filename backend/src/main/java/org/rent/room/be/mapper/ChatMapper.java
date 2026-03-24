package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.chat.ConversationResponse;
import org.rent.room.be.dto.response.chat.MessageResponse;
import org.rent.room.be.entity.Conversation;
import org.rent.room.be.entity.Message;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    @Mapping(target = "user1", source = "user1")
    @Mapping(target = "user2", source = "user2")
    ConversationResponse toConversationResponse(Conversation conversation);

    @Mapping(target = "messageId", source = "messageId")
    @Mapping(target = "senderId", source = "sender.userId")
    @Mapping(target = "senderName", source = "sender.userName")
    @Mapping(target = "content", source = "messageBody")
    @Mapping(target = "conversationId", source = "conversation.conversationId")
    @Mapping(target = "imageUrl", source = "imageUrl")
    MessageResponse toMessageResponse(Message message);
}

