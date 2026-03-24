package org.rent.room.be.repository;

import org.rent.room.be.entity.AssignmentQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentQuestionRepository extends JpaRepository<AssignmentQuestion, UUID> {

    List<AssignmentQuestion> findByAssignment_AssignmentIdOrderByQuestionOrderAsc(UUID assignmentId);
}

