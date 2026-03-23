package org.rent.room.be.repository;

import org.rent.room.be.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    @Query("SELECT DISTINCT q FROM Question q LEFT JOIN FETCH q.options WHERE q.quiz.quizId = :quizId ORDER BY q.orderIndex ASC, q.createdAt ASC")
    List<Question> findByQuiz_QuizIdWithOptions(@Param("quizId") UUID quizId);

    @Query("SELECT DISTINCT q FROM Question q LEFT JOIN FETCH q.options ORDER BY q.orderIndex ASC, q.createdAt ASC")
    List<Question> findAllWithOptions();
}

