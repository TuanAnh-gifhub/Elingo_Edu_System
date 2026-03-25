package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.submission.CreateSubmissionRequest;
import org.rent.room.be.dto.request.submission.GradeSubmissionRequest;
import org.rent.room.be.dto.response.submission.SubmissionResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface SubmissionService {

    SubmissionResponse createSubmission(CreateSubmissionRequest request);

    SubmissionResponse getSubmissionById(UUID submissionId);

    SubmissionResponse getLatestMySubmissionByAssignment(UUID assignmentId);

    Map<UUID, SubmissionResponse> getLatestMySubmissionsByAssignmentIds(List<UUID> assignmentIds);

    PageResponse<SubmissionResponse> getSubmissionsByAssignment(UUID assignmentId, int page, int size);

    SubmissionResponse gradeSubmission(UUID submissionId, GradeSubmissionRequest request);
}

