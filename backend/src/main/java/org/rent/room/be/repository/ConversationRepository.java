package org.rent.room.be.repository;

import org.rent.room.be.entity.Conversation;
import org.rent.room.be.constant.ConversationType;
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
            WHERE (
                   (c.user1.userId = :u1 AND c.user2.userId = :u2)
                   OR (c.user1.userId = :u2 AND c.user2.userId = :u1)
                  )
              AND (c.conversationType = org.rent.room.be.constant.ConversationType.DIRECT OR c.conversationType IS NULL)
            """)
    Optional<Conversation> findBetweenUsers(UUID u1, UUID u2);

    @Query("""
            SELECT c FROM Conversation c
            WHERE (
                   ((c.conversationType = org.rent.room.be.constant.ConversationType.DIRECT OR c.conversationType IS NULL)
                        AND (c.user1.userId = :userId OR c.user2.userId = :userId))
                   OR (c.conversationType = org.rent.room.be.constant.ConversationType.CLASS_GROUP
                        AND :userId MEMBER OF c.participantUserIds)
                  )
              AND (:userId NOT MEMBER OF c.hiddenByUserIds)
            ORDER BY c.updatedAt DESC
            """)
    List<Conversation> findVisibleConversationsByUserId(UUID userId);

    @Query("""
            SELECT c FROM Conversation c
            WHERE c.conversationId = :conversationId
              AND (
                   ((c.conversationType = org.rent.room.be.constant.ConversationType.DIRECT OR c.conversationType IS NULL)
                        AND (c.user1.userId = :userId OR c.user2.userId = :userId))
                   OR (c.conversationType = org.rent.room.be.constant.ConversationType.CLASS_GROUP
                        AND :userId MEMBER OF c.participantUserIds)
                  )
            """)
    Optional<Conversation> findByConversationIdAndParticipant(UUID conversationId, UUID userId);

    Optional<Conversation> findByClassRoom_ClassIdAndConversationType(UUID classId, ConversationType conversationType);

    void deleteByClassRoom_ClassIdAndConversationType(UUID classId, ConversationType conversationType);
}

