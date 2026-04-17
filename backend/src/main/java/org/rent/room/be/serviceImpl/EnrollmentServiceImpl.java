package org.rent.room.be.serviceImpl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.dto.request.enrollment.CreateEnrollmentRequest;
import org.rent.room.be.dto.request.enrollment.QuizScoreColumnRequest;
import org.rent.room.be.dto.request.enrollment.UpdateQuizScoreColumnsRequest;
import org.rent.room.be.dto.response.enrollment.ClassQuizScoreMatrixResponse;
import org.rent.room.be.dto.response.enrollment.EnrollmentResponse;
import org.rent.room.be.dto.response.enrollment.QuizScoreColumnResponse;
import org.rent.room.be.dto.response.enrollment.StudentQuizScoreRowResponse;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Course;
import org.rent.room.be.entity.Enrollment;
import org.rent.room.be.entity.Quiz;
import org.rent.room.be.entity.QuizAttempt;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WalletTransaction;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.EnrollmentMapper;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.CourseRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.QuizAttemptRepository;
import org.rent.room.be.repository.QuizRepository;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.repository.WalletTransactionRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.EnrollmentService;
import org.rent.room.be.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ClassRoomRepository classRoomRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final CourseRepository courseRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserService userService;
    private final EnrollmentMapper enrollmentMapper;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    @Transactional
    public EnrollmentResponse createEnrollment(CreateEnrollmentRequest request) {
        User student = userService.getCurrentUserEntity();
        if (!isLearner(student)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        UUID classId = request.getClassId();
        if (classId == null) {
            throw new AppException(ErrorCode.CLASS_NOT_FOUND);
        }

        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (!classRoom.isActive()) {
            throw new AppException(ErrorCode.CLASS_INACTIVE);
        }

        if (classRoom.getTeacher() != null && classRoom.getTeacher().getUserId().equals(student.getUserId())) {
            throw new AppException(ErrorCode.CLASS_SELF_ENROLL_NOT_ALLOWED);
        }

        Integer currentStudents = classRoom.getCurrentStudents() == null ? 0 : classRoom.getCurrentStudents();
        Integer maxStudents = classRoom.getMaxStudents();
        if (maxStudents != null && currentStudents >= maxStudents) {
            throw new AppException(ErrorCode.CLASS_FULL);
        }

        if (enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                student.getUserId(), classId)) {
            throw new AppException(ErrorCode.STUDENT_ALREADY_ENROLLED);
        }

        Wallet studentWallet = walletRepository.findByUser_UserId(student.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        if (studentWallet.getWalletStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }

        BigDecimal classPrice = classRoom.getPrice() == null ? BigDecimal.ZERO : classRoom.getPrice();
        BigDecimal studentBalanceBefore = studentWallet.getBalance() == null ? BigDecimal.ZERO : studentWallet.getBalance();
        if (studentBalanceBefore.compareTo(classPrice) < 0) {
            throw new AppException(ErrorCode.WALLET_INSUFFICIENT_BALANCE);
        }

        BigDecimal studentBalanceAfter = studentBalanceBefore.subtract(classPrice);
        studentWallet.setBalance(studentBalanceAfter);
        walletRepository.save(studentWallet);

        BigDecimal classWalletBalanceBefore = classRoom.getClassWalletBalance() == null
                ? BigDecimal.ZERO
                : classRoom.getClassWalletBalance();
        BigDecimal classWalletBalanceAfter = classWalletBalanceBefore.add(classPrice);
        classRoom.setClassWalletBalance(classWalletBalanceAfter);

        String transactionId = request.getTransactionId();
        if (transactionId == null || transactionId.isBlank()) {
            transactionId = "ENROLL-" + UUID.randomUUID();
        }

        walletTransactionRepository.save(WalletTransaction.builder()
                .wallet(studentWallet)
                .type(WalletTxType.PACKAGE_PURCHASE)
                .status(WalletTxStatus.COMPLETED)
                .amount(classPrice)
                .balanceBefore(studentBalanceBefore)
                .balanceAfter(studentBalanceAfter)
                .description("Thanh toán nhập học lớp " + classRoom.getClassName())
                .metadata("{\"classId\":\"" + classRoom.getClassId() + "\",\"transactionId\":\"" + transactionId + "\"}")
                .build());

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .enrolledClass(classRoom)
                .enrollmentDate(LocalDateTime.now())
                .price(classPrice)
                .paymentAmount(classPrice)
                .paymentStatus(Enrollment.PaymentStatus.PAID)
                .paymentDate(LocalDateTime.now())
                .transactionId(transactionId)
                .notes(request.getNotes())
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        classRoom.setCurrentStudents(currentStudents + 1);
        classRoomRepository.save(classRoom);

        return enrollmentMapper.toResponse(savedEnrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkEnrollment(UUID classId) {
        User student = userService.getCurrentUserEntity();
        return enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(student.getUserId(), classId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyEnrollments() {
        User student = userService.getCurrentUserEntity();
        return enrollmentMapper.toResponseList(enrollmentRepository.findByStudent_UserId(student.getUserId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByClass(UUID classId) {
        User currentUser = userService.getCurrentUserEntity();
        if (currentUser.getRole() == null || currentUser.getRole().getRoleName() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String roleName = currentUser.getRole().getRoleName();

        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if ("TEACHER".equalsIgnoreCase(roleName)) {
            boolean isOwner = classRoom.getTeacher() != null
                    && classRoom.getTeacher().getUserId() != null
                    && classRoom.getTeacher().getUserId().equals(currentUser.getUserId());
            if (!isOwner) {
                boolean enrolled = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                        currentUser.getUserId(),
                        classId
                );
                if (!enrolled) {
                    throw new AppException(ErrorCode.FORBIDDEN);
                }
            }
        } else if ("STUDENT".equalsIgnoreCase(roleName)) {
            boolean enrolled = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                    currentUser.getUserId(),
                    classId
            );
            if (!enrolled) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        } else {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return enrollmentMapper.toResponseList(
                enrollmentRepository.findByClassIdOrderByEnrollmentDateAsc(classId)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ClassQuizScoreMatrixResponse getClassQuizScoreMatrix(UUID classId) {
        User currentUser = userService.getCurrentUserEntity();
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        validateClassViewPermission(classRoom, currentUser);

        return buildQuizScoreMatrixResponse(classRoom);
    }

    @Override
    @Transactional
    public ClassQuizScoreMatrixResponse updateClassQuizScoreColumns(
            UUID classId,
            UpdateQuizScoreColumnsRequest request
    ) {
        User currentUser = userService.getCurrentUserEntity();
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        validateTeacherOwnership(classRoom, currentUser);

        List<Course> courses = courseRepository.findByClassRoom_ClassIdOrderByOrderIndexAsc(classId);
        Set<UUID> courseIds = courses.stream().map(Course::getCourseId).collect(Collectors.toSet());
        List<Quiz> quizzes = courseIds.isEmpty()
                ? List.of()
                : quizRepository.findByCourse_CourseIdIn(courseIds);
        Map<UUID, Quiz> quizById = quizzes.stream().collect(Collectors.toMap(Quiz::getQuizId, quiz -> quiz));

        List<QuizScoreColumnConfig> normalizedColumns = normalizeColumnConfigs(
                request != null ? request.getColumns() : null,
                quizById
        );

        classRoom.setQuizScoreColumnsJson(writeColumnConfigs(normalizedColumns));
        classRoomRepository.save(classRoom);

        return buildQuizScoreMatrixResponse(classRoom);
    }

    private ClassQuizScoreMatrixResponse buildQuizScoreMatrixResponse(ClassRoom classRoom) {
        UUID classId = classRoom.getClassId();
        List<Enrollment> enrollments = enrollmentRepository.findByClassIdOrderByEnrollmentDateAsc(classId);

        List<Course> courses = courseRepository.findByClassRoom_ClassIdOrderByOrderIndexAsc(classId);
        Set<UUID> courseIds = courses.stream().map(Course::getCourseId).collect(Collectors.toSet());
        List<Quiz> quizzes = courseIds.isEmpty()
                ? List.of()
                : quizRepository.findByCourse_CourseIdIn(courseIds);
        Map<UUID, Quiz> quizById = quizzes.stream().collect(Collectors.toMap(Quiz::getQuizId, quiz -> quiz));

        List<QuizScoreColumnConfig> columnConfigs = readColumnConfigs(classRoom.getQuizScoreColumnsJson()).stream()
                .filter(config -> config.getQuizId() != null && quizById.containsKey(config.getQuizId()))
                .toList();

        Set<UUID> studentIds = enrollments.stream()
                .map(enrollment -> enrollment.getStudent() != null ? enrollment.getStudent().getUserId() : null)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<UUID> quizIds = columnConfigs.stream()
                .map(QuizScoreColumnConfig::getQuizId)
                .collect(Collectors.toSet());

        Map<String, List<QuizAttempt>> attemptsByStudentAndQuiz = loadAttemptsByStudentAndQuiz(quizIds, studentIds);

        List<QuizScoreColumnResponse> columns = columnConfigs.stream()
                .map(config -> {
                    Quiz quiz = quizById.get(config.getQuizId());
                    String quizTitle = quiz != null ? quiz.getTitle() : "Quiz";
                    String columnName = deriveColumnName(config, quizTitle);
                    return QuizScoreColumnResponse.builder()
                            .columnId(config.getColumnId())
                            .quizId(config.getQuizId())
                            .quizTitle(quizTitle)
                            .columnName(columnName)
                            .attemptRule(config.getAttemptRule())
                            .attemptNumber(config.getAttemptNumber())
                            .build();
                })
                .toList();

        List<StudentQuizScoreRowResponse> rows = enrollments.stream()
                .map(enrollment -> {
                    UUID studentId = enrollment.getStudent() != null ? enrollment.getStudent().getUserId() : null;
                    Map<String, BigDecimal> quizScores = new LinkedHashMap<>();

                    for (QuizScoreColumnConfig config : columnConfigs) {
                        if (studentId == null || config.getQuizId() == null) {
                            continue;
                        }

                        List<QuizAttempt> attempts = attemptsByStudentAndQuiz
                                .getOrDefault(buildAttemptKey(studentId, config.getQuizId()), List.of());
                        BigDecimal score = resolveAttemptScore(attempts, config);
                        if (score != null) {
                            quizScores.put(config.getColumnId(), score);
                        }
                    }

                    return StudentQuizScoreRowResponse.builder()
                            .enrollmentId(enrollment.getEnrollmentId())
                            .studentId(studentId)
                            .studentName(enrollment.getStudent() != null ? enrollment.getStudent().getUserName() : null)
                            .enrollmentDate(enrollment.getEnrollmentDate())
                            .paymentStatus(enrollment.getPaymentStatus())
                            .quizScores(quizScores)
                            .build();
                })
                .toList();

        return ClassQuizScoreMatrixResponse.builder()
                .classId(classId)
                .columns(columns)
                .rows(rows)
                .build();
    }

    private void validateClassViewPermission(ClassRoom classRoom, User currentUser) {
        String roleName = currentUser.getRole() != null ? currentUser.getRole().getRoleName() : null;
        if (roleName == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        boolean isOwnerTeacher = classRoom.getTeacher() != null
                && classRoom.getTeacher().getUserId() != null
                && classRoom.getTeacher().getUserId().equals(currentUser.getUserId());
        if (isOwnerTeacher) {
            return;
        }

        boolean enrolled = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                currentUser.getUserId(),
                classRoom.getClassId()
        );

        if ("TEACHER".equalsIgnoreCase(roleName) || "STUDENT".equalsIgnoreCase(roleName)) {
            if (!enrolled) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            return;
        }

        throw new AppException(ErrorCode.FORBIDDEN);
    }

    private void validateTeacherOwnership(ClassRoom classRoom, User currentUser) {
        String roleName = currentUser.getRole() != null ? currentUser.getRole().getRoleName() : null;
        boolean isOwnerTeacher = classRoom.getTeacher() != null
                && classRoom.getTeacher().getUserId() != null
                && classRoom.getTeacher().getUserId().equals(currentUser.getUserId());

        if (!"TEACHER".equalsIgnoreCase(roleName) || !isOwnerTeacher) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private List<QuizScoreColumnConfig> normalizeColumnConfigs(
            List<QuizScoreColumnRequest> requestedColumns,
            Map<UUID, Quiz> quizById
    ) {
        if (requestedColumns == null || requestedColumns.isEmpty()) {
            return List.of();
        }

        List<QuizScoreColumnConfig> normalized = new ArrayList<>();
        for (QuizScoreColumnRequest requestItem : requestedColumns) {
            if (requestItem == null || requestItem.getQuizId() == null) {
                throw new AppException(ErrorCode.INVALID_KEY);
            }

            Quiz quiz = quizById.get(requestItem.getQuizId());
            if (quiz == null) {
                throw new AppException(ErrorCode.QUIZ_NOT_FOUND);
            }

            AttemptRule attemptRule = parseAttemptRule(requestItem.getAttemptRule());
            Integer attemptNumber = null;
            if (attemptRule == AttemptRule.ATTEMPT_NUMBER) {
                if (requestItem.getAttemptNumber() == null || requestItem.getAttemptNumber() < 1) {
                    throw new AppException(ErrorCode.INVALID_KEY);
                }
                attemptNumber = requestItem.getAttemptNumber();
            }

            String columnId = requestItem.getColumnId();
            if (columnId == null || columnId.isBlank()) {
                columnId = UUID.randomUUID().toString();
            }

            String columnName = requestItem.getColumnName();
            if (columnName == null || columnName.isBlank()) {
                columnName = deriveDefaultColumnName(quiz.getTitle(), attemptRule, attemptNumber);
            }

            normalized.add(QuizScoreColumnConfig.builder()
                    .columnId(columnId)
                    .quizId(quiz.getQuizId())
                    .columnName(columnName.trim())
                    .attemptRule(attemptRule.name())
                    .attemptNumber(attemptNumber)
                    .build());
        }

        return normalized;
    }

    private Map<String, List<QuizAttempt>> loadAttemptsByStudentAndQuiz(Set<UUID> quizIds, Set<UUID> studentIds) {
        if (quizIds.isEmpty() || studentIds.isEmpty()) {
            return Map.of();
        }

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuiz_QuizIdInAndStudent_UserIdInOrderBySubmittedAtAsc(
                quizIds,
                studentIds
        );

        Map<String, List<QuizAttempt>> result = new HashMap<>();
        for (QuizAttempt attempt : attempts) {
            if (attempt.getQuiz() == null || attempt.getQuiz().getQuizId() == null
                    || attempt.getStudent() == null || attempt.getStudent().getUserId() == null) {
                continue;
            }

            String key = buildAttemptKey(attempt.getStudent().getUserId(), attempt.getQuiz().getQuizId());
            result.computeIfAbsent(key, unused -> new ArrayList<>()).add(attempt);
        }

        result.values().forEach(list -> list.sort(Comparator.comparing(QuizAttempt::getSubmittedAt)));
        return result;
    }

    private String buildAttemptKey(UUID studentId, UUID quizId) {
        return studentId + "_" + quizId;
    }

    private BigDecimal resolveAttemptScore(List<QuizAttempt> attempts, QuizScoreColumnConfig config) {
        if (attempts == null || attempts.isEmpty() || config == null) {
            return null;
        }

        AttemptRule attemptRule = parseAttemptRule(config.getAttemptRule());

        if (attemptRule == AttemptRule.LATEST) {
            return attempts.get(attempts.size() - 1).getScore();
        }

        if (attemptRule == AttemptRule.HIGHEST) {
            return attempts.stream()
                    .map(QuizAttempt::getScore)
                    .filter(score -> score != null)
                    .max(BigDecimal::compareTo)
                    .orElse(null);
        }

        Integer attemptNumber = config.getAttemptNumber();
        if (attemptNumber == null || attemptNumber < 1) {
            return null;
        }
        int targetIndex = attemptNumber - 1;
        if (targetIndex >= attempts.size()) {
            return null;
        }
        return attempts.get(targetIndex).getScore();
    }

    private AttemptRule parseAttemptRule(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return AttemptRule.LATEST;
        }

        try {
            return AttemptRule.valueOf(rawValue.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }

    private String deriveColumnName(QuizScoreColumnConfig config, String quizTitle) {
        if (config.getColumnName() != null && !config.getColumnName().isBlank()) {
            return config.getColumnName();
        }

        AttemptRule attemptRule = parseAttemptRule(config.getAttemptRule());
        return deriveDefaultColumnName(quizTitle, attemptRule, config.getAttemptNumber());
    }

    private String deriveDefaultColumnName(String quizTitle, AttemptRule rule, Integer attemptNumber) {
        String safeQuizTitle = (quizTitle == null || quizTitle.isBlank()) ? "Quiz" : quizTitle;

        return switch (rule) {
            case HIGHEST -> safeQuizTitle + " - Diem cao nhat";
            case ATTEMPT_NUMBER -> safeQuizTitle + " - Lan " + (attemptNumber == null ? 1 : attemptNumber);
            case LATEST -> safeQuizTitle + " - Lan gan nhat";
        };
    }

    private List<QuizScoreColumnConfig> readColumnConfigs(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return List.of();
        }

        try {
            List<QuizScoreColumnConfig> parsed = OBJECT_MAPPER.readValue(
                    rawJson,
                    new TypeReference<List<QuizScoreColumnConfig>>() {
                    }
            );
            return parsed == null ? List.of() : parsed;
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String writeColumnConfigs(List<QuizScoreColumnConfig> configs) {
        try {
            return OBJECT_MAPPER.writeValueAsString(configs == null ? List.of() : configs);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private enum AttemptRule {
        LATEST,
        HIGHEST,
        ATTEMPT_NUMBER
    }

    @lombok.Builder
    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class QuizScoreColumnConfig {
        String columnId;
        UUID quizId;
        String columnName;
        String attemptRule;
        Integer attemptNumber;
    }

    private boolean isLearner(User user) {
        if (user.getRole() == null || user.getRole().getRoleName() == null) {
            return false;
        }

        String roleName = user.getRole().getRoleName();
        return user.getRole() != null
                && ("STUDENT".equalsIgnoreCase(roleName) || "TEACHER".equalsIgnoreCase(roleName));
    }
}
