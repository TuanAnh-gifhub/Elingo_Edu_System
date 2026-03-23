package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.questionOption.CreateQuestionOptionRequest;
import org.rent.room.be.dto.request.questionOption.UpdateQuestionOptionRequest;
import org.rent.room.be.dto.response.questionOption.QuestionOptionResponse;
import org.rent.room.be.service.QuestionOptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/question-options")
@Tag(name = "9. Question Option")
public class QuestionOptionController {

    QuestionOptionService questionOptionService;

    @PostMapping
    public ResponseEntity<ApiResponse<QuestionOptionResponse>> createOption(
            @RequestBody CreateQuestionOptionRequest request
    ) {
        QuestionOptionResponse response = questionOptionService.createOption(request);
        return ResponseEntity.ok(
                ApiResponse.<QuestionOptionResponse>builder()
                        .code(201)
                        .message("Create question option successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping("/{optionId}")
    public ResponseEntity<ApiResponse<QuestionOptionResponse>> getOption(
            @PathVariable UUID optionId
    ) {
        QuestionOptionResponse response = questionOptionService.getOption(optionId);
        return ResponseEntity.ok(
                ApiResponse.<QuestionOptionResponse>builder()
                        .code(200)
                        .message("Get question option successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<QuestionOptionResponse>>> getOptions(
            @RequestParam(required = false) UUID questionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<QuestionOptionResponse> result = questionOptionService.getOptions(questionId, page - 1, size);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<QuestionOptionResponse>>builder()
                        .code(200)
                        .message("Get question options successfully")
                        .result(result)
                        .build()
        );
    }

    @PutMapping("/{optionId}")
    public ResponseEntity<ApiResponse<QuestionOptionResponse>> updateOption(
            @PathVariable UUID optionId,
            @RequestBody UpdateQuestionOptionRequest request
    ) {
        QuestionOptionResponse response = questionOptionService.updateOption(optionId, request);
        return ResponseEntity.ok(
                ApiResponse.<QuestionOptionResponse>builder()
                        .code(200)
                        .message("Update question option successfully")
                        .result(response)
                        .build()
        );
    }

    @DeleteMapping("/{optionId}")
    public ResponseEntity<ApiResponse<Void>> deleteOption(
            @PathVariable UUID optionId
    ) {
        questionOptionService.deleteOption(optionId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Delete question option successfully")
                        .build()
        );
    }
}

