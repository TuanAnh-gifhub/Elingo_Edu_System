package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.course.CreateCourseRequest;
import org.rent.room.be.dto.request.course.UpdateCourseRequest;
import org.rent.room.be.dto.response.course.CourseResponse;
import org.rent.room.be.service.CourseService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/courses")
@Tag(name = "4. Course")
public class CourseController {

    CourseService courseService;
    @PreAuthorize("hasRole('TEACHER')")

    @PostMapping
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @RequestBody CreateCourseRequest request
    ) {
        CourseResponse response = courseService.createCourse(request);
        return ResponseEntity.ok(
                ApiResponse.<CourseResponse>builder()
                        .code(201)
                        .message("Create course successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourse(
            @PathVariable UUID courseId
    ) {
        CourseResponse response = courseService.getCourse(courseId);
        return ResponseEntity.ok(
                ApiResponse.<CourseResponse>builder()
                        .code(200)
                        .message("Get course successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getCourses(
            @RequestParam(required = false) UUID classId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<CourseResponse> result = courseService.getCourses(classId, page - 1, size);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<CourseResponse>>builder()
                        .code(200)
                        .message("Get courses success")
                        .result(result)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER')")

    @PutMapping("/{courseId}")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable UUID courseId,
            @RequestBody UpdateCourseRequest request
    ) {
        CourseResponse response = courseService.updateCourse(courseId, request);
        return ResponseEntity.ok(
                ApiResponse.<CourseResponse>builder()
                        .code(200)
                        .message("Update course successfully")
                        .result(response)
                        .build()
        );
    }
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{courseId}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable UUID courseId
    ) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Delete course successfully")
                        .build()
        );
    }

    @GetMapping("/{courseId}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable UUID courseId,
            @RequestParam String fileUrl
    ) {
        Resource resource = courseService.downloadFile(courseId, fileUrl);
        
        String fileName = resource.getFilename();
        String encodedFileName = URLEncoder.encode(fileName != null ? fileName : "file", StandardCharsets.UTF_8)
                .replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName)
                .body(resource);
    }
}

