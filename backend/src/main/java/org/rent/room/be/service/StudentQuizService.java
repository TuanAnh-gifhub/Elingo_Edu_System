package org.rent.room.be.service;

import org.rent.room.be.dto.request.studentQuiz.SubmitQuizRequest;
import org.rent.room.be.dto.response.studentQuiz.QuizAttemptSummaryResponse;
import org.rent.room.be.dto.response.studentQuiz.QuizSubmitResultResponse;
import org.rent.room.be.dto.response.studentQuiz.StudentQuizTakeResponse;

import java.util.List;
import java.util.UUID;

public interface StudentQuizService {

    StudentQuizTakeResponse getQuizForTake(UUID quizId);

    QuizSubmitResultResponse submitQuiz(UUID quizId, SubmitQuizRequest request);

    List<QuizAttemptSummaryResponse> getMyAttempts(UUID quizId);
}
