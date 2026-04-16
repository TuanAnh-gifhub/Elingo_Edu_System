package org.rent.room.be.repository;

import org.rent.room.be.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("""
            SELECT c FROM Conversation c
            WHERE (c.user1.userId = :u1 AND c.user2.userId = :u2)
               OR (c.user1.userId = :u2 AND c.user2.userId = :u1)
            """)
    Optional<Conversation> findBetweenUsers(UUID u1, UUID u2);

    @Query("""
            SELECT c FROM Conversation c
            WHERE (c.user1.userId = :userId OR c.user2.userId = :userId)
              AND (:userId NOT MEMBER OF c.hiddenByUserIds)
            ORDER BY c.updatedAt DESC
            """)
    List<Conversation> findVisibleConversationsByUserId(UUID userId);

    @Query("""
            SELECT c FROM Conversation c
            WHERE c.conversationId = :conversationId
              AND (c.user1.userId = :userId OR c.user2.userId = :userId)
            """)
    Optional<Conversation> findByConversationIdAndParticipant(UUID conversationId, UUID userId);
}

