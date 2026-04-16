package org.rent.room.be.repository;

import org.rent.room.be.entity.ConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, UUID> {

    Optional<ConversationMember> findByConversationConversationIdAndUserUserId(UUID conversationId, UUID userId);

    boolean existsByConversationConversationIdAndUserUserId(UUID conversationId, UUID userId);

    List<ConversationMember> findAllByConversationConversationId(UUID conversationId);
}

