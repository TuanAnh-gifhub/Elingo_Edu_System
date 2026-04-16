package org.rent.room.be.service;

import org.rent.room.be.constant.TeacherVerificationStatus;
import org.rent.room.be.dto.request.teacherVerification.TeacherVerificationSubmitRequest;
import org.rent.room.be.dto.response.teacherVerification.TeacherVerificationResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface TeacherVerificationService {
    TeacherVerificationResponse submitRequest(TeacherVerificationSubmitRequest request);

    TeacherVerificationResponse getMyRequest();

    List<TeacherVerificationResponse> getAllRequests();

    TeacherVerificationResponse getRequestById(UUID id);

    TeacherVerificationResponse approve(UUID id);

    TeacherVerificationResponse reject(UUID id, String adminNote);

    TeacherVerificationResponse review(UUID id, TeacherVerificationStatus status, String adminNote);

    String uploadCertificate(MultipartFile file);

    List<String> uploadCertificates(List<MultipartFile> files);
}
