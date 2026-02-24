package org.rent.room.be.service;

import org.rent.room.be.dto.request.category.CreateCategoryRequest;
import org.rent.room.be.dto.request.category.UpdateCategoryRequest;
import org.rent.room.be.dto.response.category.CategoryResponse;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CreateCategoryRequest request);

    CategoryResponse updateCategory(Integer categoryId, UpdateCategoryRequest request);

    void deleteCategory(Integer categoryId);

    CategoryResponse getCategoryById(Integer categoryId);

    List<CategoryResponse> getAllCategories();
}
