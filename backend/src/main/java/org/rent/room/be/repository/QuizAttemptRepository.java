package org.rent.room.be.repository;

import org.rent.room.be.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    List<QuizAttempt> findByQuiz_QuizIdAndStudent_UserIdOrderBySubmittedAtDesc(UUID quizId, UUID studentId);

    long countByQuiz_QuizIdAndStudent_UserId(UUID quizId, UUID studentId);

    Optional<QuizAttempt> findByQuizAttemptIdAndQuiz_QuizIdAndStudent_UserId(
            UUID quizAttemptId,
            UUID quizId,
            UUID studentId
    );
}
