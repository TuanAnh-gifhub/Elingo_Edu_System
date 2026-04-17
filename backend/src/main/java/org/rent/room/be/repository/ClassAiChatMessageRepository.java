package org.rent.room.be.repository;

import org.rent.room.be.entity.ClassAiChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassAiChatMessageRepository extends JpaRepository<ClassAiChatMessage, UUID> {

    List<ClassAiChatMessage> findByClassRoomClassIdAndStudentUserIdOrderByCreatedAtAsc(UUID classId, UUID studentId);
}

