package org.rent.room.be.repository;

import org.rent.room.be.entity.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("""
            select s
            from Submission s
            where s.student.userId = :studentId
              and s.assignment.assignmentId in :assignmentIds
              and s.attemptNumber = (
                  select max(s2.attemptNumber)
                  from Submission s2
                  where s2.student.userId = :studentId
                    and s2.assignment.assignmentId = s.assignment.assignmentId
              )
            """)
    List<Submission> findLatestByStudentAndAssignmentIds(
            @Param("studentId") UUID studentId,
            @Param("assignmentIds") List<UUID> assignmentIds
    );
}

