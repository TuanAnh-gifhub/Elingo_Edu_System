package org.rent.room.be.repository;

import org.rent.room.be.entity.SubmissionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmissionAnswerRepository extends JpaRepository<SubmissionAnswer, UUID> {

    List<SubmissionAnswer> findBySubmission_SubmissionIdOrderByQuestion_QuestionOrderAsc(UUID submissionId);
}

