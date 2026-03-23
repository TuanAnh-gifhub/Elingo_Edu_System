package org.rent.room.be.service;

import org.rent.room.be.dto.request.enrollment.CreateEnrollmentRequest;
import org.rent.room.be.dto.response.enrollment.EnrollmentResponse;

import java.util.UUID;

public interface EnrollmentService {

    EnrollmentResponse createEnrollment(CreateEnrollmentRequest request);
}
