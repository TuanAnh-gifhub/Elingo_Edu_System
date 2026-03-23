package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.quiz.CreateQuizRequest;
import org.rent.room.be.dto.request.quiz.UpdateQuizRequest;
import org.rent.room.be.dto.response.quiz.QuizImportResponse;
import org.rent.room.be.dto.response.quiz.QuizResponse;
import org.rent.room.be.service.QuizService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/quizzes")
@Tag(name = "7. Quiz")
public class QuizController {

    QuizService quizService;

    @PostMapping
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(
            @RequestBody CreateQuizRequest request
    ) {
        QuizResponse response = quizService.createQuiz(request);
        return ResponseEntity.ok(
                ApiResponse.<QuizResponse>builder()
                        .code(201)
                        .message("Create quiz successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuiz(
            @PathVariable UUID quizId
    ) {
        QuizResponse response = quizService.getQuiz(quizId);
        return ResponseEntity.ok(
                ApiResponse.<QuizResponse>builder()
                        .code(200)
                        .message("Get quiz successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<QuizResponse>>> getQuizzes(
            @RequestParam(required = false) UUID courseId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<QuizResponse> result = quizService.getQuizzes(courseId, page - 1, size);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<QuizResponse>>builder()
                        .code(200)
                        .message("Get quizzes successfully")
                        .result(result)
                        .build()
        );
    }

    @PutMapping("/{quizId}")
    public ResponseEntity<ApiResponse<QuizResponse>> updateQuiz(
            @PathVariable UUID quizId,
            @RequestBody UpdateQuizRequest request
    ) {
        QuizResponse response = quizService.updateQuiz(quizId, request);
        return ResponseEntity.ok(
                ApiResponse.<QuizResponse>builder()
                        .code(200)
                        .message("Update quiz successfully")
                        .result(response)
                        .build()
        );
    }

    @DeleteMapping("/{quizId}")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(
            @PathVariable UUID quizId
    ) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Delete quiz successfully")
                        .build()
        );
    }

    @PostMapping(value = "/{quizId}/import-excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<QuizImportResponse>> importQuestionsFromExcel(
            @PathVariable UUID quizId,
            @RequestParam("file") MultipartFile file
    ) {
        QuizImportResponse response = quizService.importQuestionsFromExcel(quizId, file);
        return ResponseEntity.ok(
                ApiResponse.<QuizImportResponse>builder()
                        .code(200)
                        .message("Import questions successfully")
                        .result(response)
                        .build()
        );
    }
}
