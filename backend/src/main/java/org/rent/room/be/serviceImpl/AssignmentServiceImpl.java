package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.AssignmentQuestionType;
import org.rent.room.be.dto.request.assignment.AssignmentQuestionRequest;
import org.rent.room.be.dto.request.assignment.CreateAssignmentRequest;
import org.rent.room.be.dto.request.assignment.UpdateAssignmentRequest;
import org.rent.room.be.dto.response.assignment.AssignmentQuestionResponse;
import org.rent.room.be.dto.response.assignment.AssignmentResponse;
import org.rent.room.be.entity.Assignment;
import org.rent.room.be.entity.AssignmentQuestion;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.AssignmentMapper;
import org.rent.room.be.repository.AssignmentRepository;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.service.AssignmentService;
import org.rent.room.be.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.rent.room.be.specification.AssignmentSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final ClassRoomRepository classRoomRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserService userService;
    private final AssignmentMapper assignmentMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public AssignmentResponse createAssignment(CreateAssignmentRequest request) {
        User teacher = userService.getCurrentUserEntity();
        validateTeacher(teacher);

        ClassRoom classRoom = classRoomRepository.findById(request.getClassId())
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (!teacher.getUserId().equals(classRoom.getTeacher().getUserId())) {
            throw new AppException(ErrorCode.ASSIGNMENT_FORBIDDEN);
        }

        validateQuestions(request.getQuestions());

        Assignment assignment = Assignment.builder()
                .classRoom(classRoom)
                .teacher(teacher)
                .title(request.getTitle())
                .description(request.getDescription())
                .deadline(request.getDeadline())
                .accessPasswordHash(encodePassword(request.getAccessPassword()))
                .maxAttempts(resolveMaxAttempts(request.getMaxAttempts()))
                .timeLimitMinutes(resolveTimeLimitMinutes(request.getTimeLimitMinutes()))
                .active(true)
                .build();

        assignment.setQuestions(
                request.getQuestions().stream()
                        .map(item -> mapQuestionRequest(assignment, item))
                        .toList()
        );

        return toResponse(assignmentRepository.save(assignment));
    }

    @Override
    @Transactional
    public AssignmentResponse updateAssignment(UUID assignmentId, UpdateAssignmentRequest request) {
        User teacher = userService.getCurrentUserEntity();
        validateTeacher(teacher);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        ensureAssignmentOwner(assignment, teacher.getUserId());

        if (request.getTitle() != null) {
            assignment.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            assignment.setDescription(request.getDescription());
        }
        if (Boolean.TRUE.equals(request.getClearDeadline())) {
            assignment.setDeadline(null);
        } else if (request.getDeadline() != null) {
            assignment.setDeadline(request.getDeadline());
        }
        if (request.getAccessPassword() != null) {
            assignment.setAccessPasswordHash(encodePassword(request.getAccessPassword()));
        }
        if (request.getMaxAttempts() != null) {
            assignment.setMaxAttempts(resolveMaxAttempts(request.getMaxAttempts()));
        }
        if (Boolean.TRUE.equals(request.getClearTimeLimit())) {
            assignment.setTimeLimitMinutes(null);
        } else if (request.getTimeLimitMinutes() != null) {
            assignment.setTimeLimitMinutes(resolveTimeLimitMinutes(request.getTimeLimitMinutes()));
        }
        if (request.getActive() != null) {
            assignment.setActive(request.getActive());
        }

        if (request.getQuestions() != null) {
            validateQuestions(request.getQuestions());
            if (assignment.getQuestions() == null) {
                assignment.setQuestions(new ArrayList<>());
            }
            assignment.getQuestions().clear();
            assignment.getQuestions().addAll(
                    request.getQuestions().stream()
                            .map(item -> mapQuestionRequest(assignment, item))
                            .toList()
            );
        }

        return toResponse(assignmentRepository.save(assignment));
    }

    @Override
    @Transactional
    public void deleteAssignment(UUID assignmentId) {
        User teacher = userService.getCurrentUserEntity();
        validateTeacher(teacher);

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        ensureAssignmentOwner(assignment, teacher.getUserId());
        assignment.setActive(false);
        assignmentRepository.save(assignment);
    }

    @Override
    public AssignmentResponse getAssignmentById(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        User currentUser = userService.getCurrentUserEntity();
        if ("STUDENT".equalsIgnoreCase(currentUser.getRole().getRoleName())) {
            boolean enrolled = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                    currentUser.getUserId(),
                    assignment.getClassRoom().getClassId()
            );
            if (!enrolled) {
                throw new AppException(ErrorCode.CLASS_JOIN_REQUIRED);
            }
        }

        return toResponse(assignment);
    }

    @Override
    public PageResponse<AssignmentResponse> getAssignments(
            int page,
            int size,
            UUID classId,
            UUID teacherId,
            String keyword,
            LocalDateTime deadlineFrom,
            LocalDateTime deadlineTo,
            Boolean active
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Assignment> spec = AssignmentSpecification.filterAssignments(
                classId, teacherId, keyword, deadlineFrom, deadlineTo, active
        );

        User currentUser = userService.getCurrentUserEntity();
        if ("STUDENT".equalsIgnoreCase(currentUser.getRole().getRoleName())) {
            List<UUID> joinedClassIds = enrollmentRepository.findJoinedClassIdsByStudentId(currentUser.getUserId());

            if (classId != null && !joinedClassIds.contains(classId)) {
                return PageResponse.<AssignmentResponse>builder()
                        .currentPage(page + 1)
                        .totalPages(1)
                        .pageSize(size)
                        .totalElements(0)
                        .data(List.of())
                        .build();
            }

            spec = spec.and(AssignmentSpecification.classIdIn(joinedClassIds));
        }

        Page<Assignment> assignmentPage = assignmentRepository.findAll(spec, pageable);
        Page<AssignmentResponse> mapped = assignmentPage.map(this::toResponse);

        return PageResponse.<AssignmentResponse>builder()
                .currentPage(page + 1)
                .totalPages(assignmentPage.getTotalPages())
                .pageSize(assignmentPage.getSize())
                .totalElements(assignmentPage.getTotalElements())
                .data(mapped.getContent())
                .build();
    }

    @Override
    public void validateAssignmentStart(UUID assignmentId, String accessPassword) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        if (!assignment.isActive()) {
            throw new AppException(ErrorCode.ASSIGNMENT_NOT_ACTIVE);
        }

        if (assignment.getDeadline() != null && LocalDateTime.now().isAfter(assignment.getDeadline())) {
            throw new AppException(ErrorCode.ASSIGNMENT_DEADLINE_EXCEEDED);
        }

        User currentUser = userService.getCurrentUserEntity();
        if ("STUDENT".equalsIgnoreCase(currentUser.getRole().getRoleName())) {
            boolean enrolled = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                    currentUser.getUserId(),
                    assignment.getClassRoom().getClassId()
            );
            if (!enrolled) {
                throw new AppException(ErrorCode.CLASS_JOIN_REQUIRED);
            }
        }

        if (assignment.getAccessPasswordHash() != null && !assignment.getAccessPasswordHash().isBlank()) {
            if (accessPassword == null || !passwordEncoder.matches(accessPassword, assignment.getAccessPasswordHash())) {
                throw new AppException(ErrorCode.ASSIGNMENT_PASSWORD_INVALID);
            }
        }
    }

    private void validateTeacher(User teacher) {
        if (!"TEACHER".equalsIgnoreCase(teacher.getRole().getRoleName())) {
            throw new AppException(ErrorCode.ASSIGNMENT_FORBIDDEN);
        }
    }

    private void ensureAssignmentOwner(Assignment assignment, UUID userId) {
        if (!assignment.getTeacher().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.ASSIGNMENT_FORBIDDEN);
        }
    }

    private void validateQuestions(List<AssignmentQuestionRequest> questions) {
        questions.stream()
                .sorted(Comparator.comparing(AssignmentQuestionRequest::getQuestionOrder))
                .forEach(question -> {
                    if (question.getQuestionType() == AssignmentQuestionType.MULTIPLE_CHOICE) {
                        if (question.getOptions() == null || question.getOptions().size() < 2) {
                            throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_INVALID);
                        }

                        if (question.getOptions().stream().anyMatch(option -> option == null || option.trim().isEmpty())) {
                            throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_INVALID);
                        }

                        List<Integer> correctIndexes = resolveCorrectOptionIndexes(question);
                        if (correctIndexes.isEmpty()) {
                            throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_INVALID);
                        }

                        boolean hasOutOfRangeIndex = correctIndexes.stream()
                                .anyMatch(index -> index < 0 || index >= question.getOptions().size());
                        if (hasOutOfRangeIndex) {
                            throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_INVALID);
                        }
                    }
                });
    }

    private AssignmentQuestion mapQuestionRequest(Assignment assignment, AssignmentQuestionRequest item) {
        List<Integer> correctIndexes = item.getQuestionType() == AssignmentQuestionType.MULTIPLE_CHOICE
                ? resolveCorrectOptionIndexes(item)
                : List.of();

        return AssignmentQuestion.builder()
                .assignment(assignment)
                .questionOrder(item.getQuestionOrder())
                .questionType(item.getQuestionType())
                .questionContent(item.getQuestionContent())
                .options(item.getOptions())
                .correctOptionIndex(correctIndexes.isEmpty() ? null : correctIndexes.get(0))
                .correctOptionIndexes(correctIndexes.isEmpty() ? null : correctIndexes)
                .sampleAnswer(item.getSampleAnswer())
                .maxScore(item.getMaxScore())
                .build();
    }

    private AssignmentResponse toResponse(Assignment assignment) {
        AssignmentResponse response = assignmentMapper.toResponse(assignment);
        response.setPasswordRequired(assignment.getAccessPasswordHash() != null && !assignment.getAccessPasswordHash().isBlank());
        response.setMaxAttempts(resolveMaxAttempts(assignment.getMaxAttempts()));
        response.setTimeLimitMinutes(resolveTimeLimitMinutes(assignment.getTimeLimitMinutes()));

        List<AssignmentQuestionResponse> questionResponses = assignment.getQuestions() == null
                ? List.of()
                : assignment.getQuestions().stream()
                .sorted(Comparator.comparing(AssignmentQuestion::getQuestionOrder))
                .map(question -> {
                    AssignmentQuestionResponse questionResponse = assignmentMapper.toQuestionResponse(question);
                    if (questionResponse.getCorrectOptionIndexes() == null || questionResponse.getCorrectOptionIndexes().isEmpty()) {
                        if (question.getCorrectOptionIndexes() != null && !question.getCorrectOptionIndexes().isEmpty()) {
                            questionResponse.setCorrectOptionIndexes(question.getCorrectOptionIndexes());
                        } else if (question.getCorrectOptionIndex() != null) {
                            questionResponse.setCorrectOptionIndexes(List.of(question.getCorrectOptionIndex()));
                        }
                    }
                    return questionResponse;
                })
                .toList();

        response.setQuestions(questionResponses);
        return response;
    }

    private List<Integer> resolveCorrectOptionIndexes(AssignmentQuestionRequest question) {
        List<Integer> indexes = question.getCorrectOptionIndexes();

        if (indexes == null || indexes.isEmpty()) {
            if (question.getCorrectOptionIndex() == null) {
                return List.of();
            }
            indexes = List.of(question.getCorrectOptionIndex());
        }

        List<Integer> normalized = indexes.stream()
                .filter(java.util.Objects::nonNull)
                .toList();

        if (normalized.size() != indexes.size()) {
            throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_INVALID);
        }

        LinkedHashSet<Integer> uniqueOrdered = new LinkedHashSet<>(normalized);
        List<Integer> result = new ArrayList<>(uniqueOrdered);
        Collections.sort(result);
        return result;
    }

    private Integer resolveMaxAttempts(Integer maxAttempts) {
        int resolved = maxAttempts == null ? 1 : maxAttempts;
        if (resolved < 1) {
            throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_INVALID);
        }
        return resolved;
    }

    private Integer resolveTimeLimitMinutes(Integer timeLimitMinutes) {
        if (timeLimitMinutes == null) {
            return null;
        }
        if (timeLimitMinutes < 1) {
            throw new AppException(ErrorCode.ASSIGNMENT_TIME_LIMIT_INVALID);
        }
        return timeLimitMinutes;
    }

    private String encodePassword(String rawPassword) {
        if (rawPassword == null) {
            return null;
        }

        String trimmed = rawPassword.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        return passwordEncoder.encode(trimmed);
    }
}


