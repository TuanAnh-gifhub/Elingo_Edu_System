package org.rent.room.be.repository;

import org.rent.room.be.entity.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    Page<Submission> findByAssignment_AssignmentId(UUID assignmentId, Pageable pageable);

    Optional<Submission> findFirstByAssignment_AssignmentIdAndStudent_UserIdOrderByAttemptNumberDesc(UUID assignmentId, UUID studentId);

    long countByAssignment_AssignmentIdAndStudent_UserId(UUID assignmentId, UUID studentId);

    List<Submission> findByAssignment_AssignmentIdAndStudent_UserIdOrderByAttemptNumberDesc(UUID assignmentId, UUID studentId);
}

