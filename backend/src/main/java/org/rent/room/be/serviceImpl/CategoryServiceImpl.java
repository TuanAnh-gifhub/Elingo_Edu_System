package org.rent.room.be.serviceImpl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.dto.request.category.CreateCategoryRequest;
import org.rent.room.be.dto.request.category.UpdateCategoryRequest;
import org.rent.room.be.dto.response.category.CategoryResponse;
import org.rent.room.be.entity.Category;
import org.rent.room.be.repository.CategoryRepository;
import org.rent.room.be.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryServiceImpl implements CategoryService {

    CategoryRepository categoryRepository;

    @Override
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String name = request.getCategoryName() == null ? null : request.getCategoryName().trim();

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }

        if (categoryRepository.existsByCategoryNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Category name already exists");
        }

        Category category = Category.builder()
                .categoryName(name)
                .build();

        category = categoryRepository.save(category);
        return mapToResponse(category);
    }

    @Override
    public CategoryResponse updateCategory(Integer categoryId, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found"));

        String name = request.getCategoryName() == null ? null : request.getCategoryName().trim();

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }

        if (!category.getCategoryName().equalsIgnoreCase(name)
                && categoryRepository.existsByCategoryNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Category name already exists");
        }

        category.setCategoryName(name);

        category = categoryRepository.save(category);
        return mapToResponse(category);
    }

    @Override
    public void deleteCategory(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found"));

        // Không cho xóa nếu đang được Room dùng
        if (category.getRooms() != null && !category.getRooms().isEmpty()) {
            throw new IllegalArgumentException("Category is being used by rooms, cannot delete");
        }

        categoryRepository.delete(category);
    }

    @Override
    public CategoryResponse getCategoryById(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found"));
        return mapToResponse(category);
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .build();
    }
}
