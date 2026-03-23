package org.rent.room.be.service;

import org.rent.room.be.dto.request.question.CreateQuestionRequest;
import org.rent.room.be.dto.request.question.UpdateQuestionRequest;
import org.rent.room.be.dto.response.question.QuestionResponse;

import java.util.List;
import java.util.UUID;

public interface QuestionService {
    QuestionResponse createQuestion(CreateQuestionRequest request);

    QuestionResponse getQuestion(UUID questionId);

    List<QuestionResponse> getQuestions(UUID quizId);

    QuestionResponse updateQuestion(UUID questionId, UpdateQuestionRequest request);

    void deleteQuestion(UUID questionId);
}

