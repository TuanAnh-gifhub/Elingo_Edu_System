package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.classroom.JoinClassRequest;
import org.rent.room.be.dto.response.assignment.AssignmentResponse;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;
import org.rent.room.be.service.AssignmentService;
import org.rent.room.be.service.ClassRoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/groups")
@Tag(name = "9b. Assignment Group")
public class GroupController {

    ClassRoomService classRoomService;
    AssignmentService assignmentService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<ClassRoomResponse>>> getGroups(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) Boolean active
    ) {
        PageResponse<ClassRoomResponse> result = classRoomService.getClasses(page - 1, size, keyword, teacherId, active);
        return ResponseEntity.ok(ApiResponse.<PageResponse<ClassRoomResponse>>builder()
                .code(200)
                .message("Get groups successfully")
                .result(result)
                .build());
    }

    @PostMapping("/{groupId}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> joinGroup(
            @PathVariable UUID groupId,
            @RequestBody(required = false) JoinClassRequest request
    ) {
        classRoomService.joinClass(groupId, request != null ? request.getJoinCode() : null);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(200)
                .message("Join group successfully")
                .build());
    }

    @GetMapping("/{groupId}/assignments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<AssignmentResponse>>> getAssignmentsByGroup(
            @PathVariable UUID groupId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean active
    ) {
        PageResponse<AssignmentResponse> result = assignmentService.getAssignments(
                page - 1,
                size,
                groupId,
                null,
                keyword,
                null,
                null,
                active
        );
        return ResponseEntity.ok(ApiResponse.<PageResponse<AssignmentResponse>>builder()
                .code(200)
                .message("Get group assignments successfully")
                .result(result)
                .build());
    }
}

