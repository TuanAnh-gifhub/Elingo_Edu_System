package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.category.CreateCategoryRequest;
import org.rent.room.be.dto.request.category.UpdateCategoryRequest;
import org.rent.room.be.dto.response.category.CategoryResponse;
import org.rent.room.be.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/categories")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "11. Category")
public class CategoryController {

    CategoryService categoryService;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        CategoryResponse result = categoryService.createCategory(request);

        ApiResponse<CategoryResponse> response = ApiResponse.<CategoryResponse>builder()
                .code(200)
                .message("Create category successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Integer categoryId,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        CategoryResponse result = categoryService.updateCategory(categoryId, request);

        ApiResponse<CategoryResponse> response = ApiResponse.<CategoryResponse>builder()
                .code(200)
                .message("Update category successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Integer categoryId
    ) {
        categoryService.deleteCategory(categoryId);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(200)
                .message("Delete category successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(
            @PathVariable Integer categoryId
    ) {
        CategoryResponse result = categoryService.getCategoryById(categoryId);

        ApiResponse<CategoryResponse> response = ApiResponse.<CategoryResponse>builder()
                .code(200)
                .message("Get category successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> result = categoryService.getAllCategories();

        ApiResponse<List<CategoryResponse>> response = ApiResponse.<List<CategoryResponse>>builder()
                .code(200)
                .message("Get all categories successfully")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }
}
