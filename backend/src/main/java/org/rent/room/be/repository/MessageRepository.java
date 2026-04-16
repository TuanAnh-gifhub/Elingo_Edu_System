package org.rent.room.be.repository;

import org.rent.room.be.constant.MessageStatus;
import org.rent.room.be.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByConversationConversationIdOrderByCreatedAtAsc(UUID conversationId);

    List<Message> findByConversationConversationIdAndRecipientUserIdAndStatusNot(
            UUID conversationId,
            UUID userId,
            MessageStatus status
    );
}

