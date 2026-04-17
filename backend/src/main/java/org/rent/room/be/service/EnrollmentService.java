package org.rent.room.be.service;

import org.rent.room.be.dto.request.enrollment.CreateEnrollmentRequest;
import org.rent.room.be.dto.request.enrollment.UpdateQuizScoreColumnsRequest;
import org.rent.room.be.dto.response.enrollment.ClassQuizScoreMatrixResponse;
import org.rent.room.be.dto.response.enrollment.EnrollmentResponse;

import java.util.List;
import java.util.UUID;

public interface EnrollmentService {

    EnrollmentResponse createEnrollment(CreateEnrollmentRequest request);

    boolean checkEnrollment(UUID classId);

    List<EnrollmentResponse> getMyEnrollments();

    List<EnrollmentResponse> getEnrollmentsByClass(UUID classId);

    ClassQuizScoreMatrixResponse getClassQuizScoreMatrix(UUID classId);

    ClassQuizScoreMatrixResponse updateClassQuizScoreColumns(UUID classId, UpdateQuizScoreColumnsRequest request);
}
