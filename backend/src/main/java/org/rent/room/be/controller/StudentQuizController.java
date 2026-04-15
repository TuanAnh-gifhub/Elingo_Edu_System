package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.studentQuiz.SubmitQuizRequest;
import org.rent.room.be.dto.response.studentQuiz.QuizAttemptSummaryResponse;
import org.rent.room.be.dto.response.studentQuiz.QuizSubmitResultResponse;
import org.rent.room.be.dto.response.studentQuiz.StudentQuizTakeResponse;
import org.rent.room.be.service.StudentQuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/student/quizzes")
@Tag(name = "9. Student Quiz")
@PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
public class StudentQuizController {

    StudentQuizService studentQuizService;

    @GetMapping("/{quizId}/take")
    public ResponseEntity<ApiResponse<StudentQuizTakeResponse>> getQuizForTake(
            @PathVariable UUID quizId
    ) {
        StudentQuizTakeResponse result = studentQuizService.getQuizForTake(quizId);
        return ResponseEntity.ok(
                ApiResponse.<StudentQuizTakeResponse>builder()
                        .code(200)
                        .message("Get quiz for attempt successfully")
                        .result(result)
                        .build()
        );
    }

    @PostMapping("/{quizId}/submit")
    public ResponseEntity<ApiResponse<QuizSubmitResultResponse>> submitQuiz(
            @PathVariable UUID quizId,
            @RequestBody SubmitQuizRequest request
    ) {
        QuizSubmitResultResponse result = studentQuizService.submitQuiz(quizId, request);
        return ResponseEntity.ok(
                ApiResponse.<QuizSubmitResultResponse>builder()
                        .code(200)
                        .message("Submit quiz successfully")
                        .result(result)
                        .build()
        );
    }

    @GetMapping("/{quizId}/my-attempts")
    public ResponseEntity<ApiResponse<List<QuizAttemptSummaryResponse>>> getMyAttempts(
            @PathVariable UUID quizId
    ) {
        List<QuizAttemptSummaryResponse> result = studentQuizService.getMyAttempts(quizId);
        return ResponseEntity.ok(
                ApiResponse.<List<QuizAttemptSummaryResponse>>builder()
                        .code(200)
                        .message("Get your quiz attempts successfully")
                        .result(result)
                        .build()
        );
    }
}
