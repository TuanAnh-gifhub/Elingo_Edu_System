package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.TeacherVerificationStatus;
import org.rent.room.be.dto.request.teacherVerification.TeacherVerificationSubmitRequest;
import org.rent.room.be.dto.response.teacherVerification.TeacherVerificationResponse;
import org.rent.room.be.entity.Role;
import org.rent.room.be.entity.TeacherVerificationRequest;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.repository.RoleRepository;
import org.rent.room.be.repository.TeacherVerificationRequestRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.TeacherVerificationService;
import org.rent.room.be.service.UploadService;
import org.rent.room.be.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TeacherVerificationServiceImpl implements TeacherVerificationService {

    private static final long MAX_CERTIFICATE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_CERTIFICATE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "pdf");

    private final TeacherVerificationRequestRepository teacherVerificationRequestRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final UploadService uploadService;

    @Override
    @Transactional
    public TeacherVerificationResponse submitRequest(TeacherVerificationSubmitRequest request) {
        User currentUser = userService.getCurrentUserEntity();

        String currentRole = currentUser.getRole() == null ? "" : currentUser.getRole().getRoleName();
        if ("TEACHER".equalsIgnoreCase(currentRole)) {
            throw new AppException(ErrorCode.TEACHER_VERIFICATION_ALREADY_APPROVED);
        }

        Optional<TeacherVerificationRequest> latestRequest =
                teacherVerificationRequestRepository.findTopByUserUserIdOrderByCreatedAtDesc(currentUser.getUserId());

        if (latestRequest.isPresent() && latestRequest.get().getStatus() == TeacherVerificationStatus.PENDING) {
            throw new AppException(ErrorCode.TEACHER_VERIFICATION_ALREADY_PENDING);
        }

        List<String> normalizedFiles = normalizeAndValidateCertificateFiles(request.getCertificateFiles());

        TeacherVerificationRequest entity = TeacherVerificationRequest.builder()
                .user(currentUser)
                .fullName(request.getFullName().trim())
                .email(currentUser.getEmail())
                .phone(request.getPhone() == null ? null : request.getPhone().trim())
                .bio(request.getBio().trim())
                .expertise(request.getExpertise().trim())
                .experience(request.getExperience().trim())
                .certificateFiles(normalizedFiles)
                .portfolioLink(StringUtils.hasText(request.getPortfolioLink()) ? request.getPortfolioLink().trim() : null)
                .status(TeacherVerificationStatus.PENDING)
                .adminNote(null)
                .build();

        return toResponse(teacherVerificationRequestRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherVerificationResponse getMyRequest() {
        User currentUser = userService.getCurrentUserEntity();
        TeacherVerificationRequest entity = teacherVerificationRequestRepository
                .findTopByUserUserIdOrderByCreatedAtDesc(currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.TEACHER_VERIFICATION_NOT_FOUND));
        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherVerificationResponse> getAllRequests() {
        return teacherVerificationRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherVerificationResponse getRequestById(UUID id) {
        TeacherVerificationRequest entity = teacherVerificationRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TEACHER_VERIFICATION_NOT_FOUND));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public TeacherVerificationResponse approve(UUID id) {
        return review(id, TeacherVerificationStatus.APPROVED, null);
    }

    @Override
    @Transactional
    public TeacherVerificationResponse reject(UUID id, String adminNote) {
        return review(id, TeacherVerificationStatus.REJECTED, adminNote);
    }

    @Override
    @Transactional
    public TeacherVerificationResponse review(UUID id, TeacherVerificationStatus status, String adminNote) {
        TeacherVerificationRequest entity = teacherVerificationRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TEACHER_VERIFICATION_NOT_FOUND));

        User user = entity.getUser();

        if (status == TeacherVerificationStatus.APPROVED) {
            entity.setStatus(TeacherVerificationStatus.APPROVED);
            entity.setAdminNote(null);

            Role teacherRole = roleRepository.findByRoleName("TEACHER")
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            user.setRole(teacherRole);
            userRepository.save(user);
        } else if (status == TeacherVerificationStatus.REJECTED) {
            entity.setStatus(TeacherVerificationStatus.REJECTED);
            entity.setAdminNote(StringUtils.hasText(adminNote) ? adminNote.trim() : null);

            Role studentRole = roleRepository.findByRoleName("STUDENT")
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            user.setRole(studentRole);
            userRepository.save(user);
        } else {
            entity.setStatus(TeacherVerificationStatus.PENDING);
            entity.setAdminNote(StringUtils.hasText(adminNote) ? adminNote.trim() : null);
        }

        return toResponse(teacherVerificationRequestRepository.save(entity));
    }

    @Override
    public String uploadCertificate(MultipartFile file) {
        validateCertificateMultipart(file);
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = uploadService.uploadImage(file);
            return String.valueOf(uploadResult.get("secure_url"));
        } catch (IOException e) {
            throw new RuntimeException("Upload certificate failed", e);
        }
    }

    private void validateCertificateMultipart(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.CERTIFICATE_REQUIRED);
        }

        if (file.getSize() > MAX_CERTIFICATE_SIZE_BYTES) {
            throw new AppException(ErrorCode.CERTIFICATE_FILE_TOO_LARGE);
        }

        String contentType = file.getContentType();
        boolean allowedMime = contentType != null
                && (contentType.startsWith("image/") || "application/pdf".equalsIgnoreCase(contentType));

        if (!allowedMime) {
            throw new AppException(ErrorCode.INVALID_CERTIFICATE_FILE);
        }
    }

    private List<String> normalizeAndValidateCertificateFiles(List<String> files) {
        if (files == null || files.isEmpty()) {
            throw new AppException(ErrorCode.CERTIFICATE_REQUIRED);
        }

        List<String> normalized = files.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();

        if (normalized.isEmpty()) {
            throw new AppException(ErrorCode.CERTIFICATE_REQUIRED);
        }

        normalized.forEach(this::validateCertificateUrl);
        return normalized;
    }

    private void validateCertificateUrl(String fileUrl) {
        String extension = extractExtension(fileUrl).toLowerCase(Locale.ROOT);
        if (!ALLOWED_CERTIFICATE_EXTENSIONS.contains(extension)) {
            throw new AppException(ErrorCode.INVALID_CERTIFICATE_FILE);
        }
    }

    private String extractExtension(String fileUrl) {
        try {
            URI uri = new URI(fileUrl);
            String path = uri.getPath();
            return getExtension(path == null ? fileUrl : path);
        } catch (URISyntaxException e) {
            return getExtension(fileUrl);
        }
    }

    private String getExtension(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        String sanitized = value.split("\\?")[0];
        int dotIndex = sanitized.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == sanitized.length() - 1) {
            return "";
        }

        return sanitized.substring(dotIndex + 1);
    }

    private TeacherVerificationResponse toResponse(TeacherVerificationRequest entity) {
        return TeacherVerificationResponse.builder()
                .id(entity.getId())
                .userId(entity.getUser().getUserId())
                .role(entity.getUser().getRole() == null ? null : entity.getUser().getRole().getRoleName())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .bio(entity.getBio())
                .expertise(entity.getExpertise())
                .experience(entity.getExperience())
                .certificateFiles(entity.getCertificateFiles())
                .portfolioLink(entity.getPortfolioLink())
                .status(entity.getStatus())
                .adminNote(entity.getAdminNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

