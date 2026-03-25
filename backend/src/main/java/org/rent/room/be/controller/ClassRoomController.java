package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.classroom.CreateClassRoomRequest;
import org.rent.room.be.dto.request.classroom.UpdateClassRoomRequest;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;
import org.rent.room.be.service.ClassRoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/classes")
@Tag(name = "3. ClassRoom")
public class ClassRoomController {

    ClassRoomService classRoomService;

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<ApiResponse<ClassRoomResponse>> createClass(
            @Valid @RequestBody CreateClassRoomRequest request
    ) {
        ClassRoomResponse response = classRoomService.createClass(request);
        return ResponseEntity.ok(
                ApiResponse.<ClassRoomResponse>builder()
                        .code(201)
                        .message("Create class successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<ClassRoomResponse>> getClassById(
            @PathVariable UUID classId
    ) {
        ClassRoomResponse response = classRoomService.getById(classId);
        return ResponseEntity.ok(
                ApiResponse.<ClassRoomResponse>builder()
                        .code(200)
                        .message("Get class successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ClassRoomResponse>>> getClasses(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) Boolean active
    ) {
        PageResponse<ClassRoomResponse> result = classRoomService.getClasses(page - 1, size, keyword, teacherId, active);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<ClassRoomResponse>>builder()
                        .code(200)
                        .message("Get classes success")
                        .result(result)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{classId}")
    public ResponseEntity<ApiResponse<ClassRoomResponse>> updateClass(
            @PathVariable UUID classId,
            @Valid @RequestBody UpdateClassRoomRequest request
    ) {
        ClassRoomResponse response = classRoomService.updateClass(classId, request);
        return ResponseEntity.ok(
                ApiResponse.<ClassRoomResponse>builder()
                        .code(200)
                        .message("Update class successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @DeleteMapping("/{classId}")
    public ResponseEntity<ApiResponse<Void>> deleteClass(
            @PathVariable UUID classId
    ) {
        classRoomService.softDeleteClass(classId);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                    .code(200)
                    .message("Delete class successfully (soft delete)")
                    .build()
        );
    }
}

