package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.assignment.CreateAssignmentRequest;
import org.rent.room.be.dto.request.assignment.UpdateAssignmentRequest;
import org.rent.room.be.dto.response.assignment.AssignmentResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AssignmentService {

    AssignmentResponse createAssignment(CreateAssignmentRequest request);

    AssignmentResponse updateAssignment(UUID assignmentId, UpdateAssignmentRequest request);

    void deleteAssignment(UUID assignmentId);

    AssignmentResponse getAssignmentById(UUID assignmentId);

    PageResponse<AssignmentResponse> getAssignments(
            int page,
            int size,
            UUID classId,
            UUID teacherId,
            String keyword,
            LocalDateTime deadlineFrom,
            LocalDateTime deadlineTo,
            Boolean active
    );
}

