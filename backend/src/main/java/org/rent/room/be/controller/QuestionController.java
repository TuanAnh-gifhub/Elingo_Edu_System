package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.question.CreateQuestionRequest;
import org.rent.room.be.dto.request.question.UpdateQuestionRequest;
import org.rent.room.be.dto.response.question.QuestionResponse;
import org.rent.room.be.service.QuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/questions")
@Tag(name = "8. Question")
public class QuestionController {

    QuestionService questionService;

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @RequestBody CreateQuestionRequest request
    ) {
        QuestionResponse response = questionService.createQuestion(request);
        return ResponseEntity.ok(
                ApiResponse.<QuestionResponse>builder()
                        .code(201)
                        .message("Create question successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping("/{questionId}")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestion(
            @PathVariable UUID questionId
    ) {
        QuestionResponse response = questionService.getQuestion(questionId);
        return ResponseEntity.ok(
                ApiResponse.<QuestionResponse>builder()
                        .code(200)
                        .message("Get question successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestions(
            @RequestParam(required = false) UUID quizId
    ) {
        List<QuestionResponse> result = questionService.getQuestions(quizId);
        return ResponseEntity.ok(
                ApiResponse.<List<QuestionResponse>>builder()
                        .code(200)
                        .message("Get questions successfully")
                        .result(result)
                        .build()
        );
    }

    @PutMapping("/{questionId}")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable UUID questionId,
            @RequestBody UpdateQuestionRequest request
    ) {
        QuestionResponse response = questionService.updateQuestion(questionId, request);
        return ResponseEntity.ok(
                ApiResponse.<QuestionResponse>builder()
                        .code(200)
                        .message("Update question successfully")
                        .result(response)
                        .build()
        );
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @PathVariable UUID questionId
    ) {
        questionService.deleteQuestion(questionId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Delete question successfully")
                        .build()
        );
    }
}

