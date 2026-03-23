package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.quiz.CreateQuizRequest;
import org.rent.room.be.dto.request.quiz.UpdateQuizRequest;
import org.rent.room.be.dto.response.quiz.QuizImportResponse;
import org.rent.room.be.dto.response.quiz.QuizResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface QuizService {

    QuizResponse createQuiz(CreateQuizRequest request);

    QuizResponse getQuiz(UUID quizId);

    PageResponse<QuizResponse> getQuizzes(UUID courseId, int page, int size);

    QuizResponse updateQuiz(UUID quizId, UpdateQuizRequest request);

    void deleteQuiz(UUID quizId);

    QuizImportResponse importQuestionsFromExcel(UUID quizId, MultipartFile file);
}
