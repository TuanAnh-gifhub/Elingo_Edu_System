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
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final ClassRoomRepository classRoomRepository;
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
                        if (question.getCorrectOptionIndex() == null
                                || question.getCorrectOptionIndex() < 0
                                || question.getCorrectOptionIndex() >= question.getOptions().size()) {
                            throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_INVALID);
                        }
                    }
                });
    }

    private AssignmentQuestion mapQuestionRequest(Assignment assignment, AssignmentQuestionRequest item) {
        return AssignmentQuestion.builder()
                .assignment(assignment)
                .questionOrder(item.getQuestionOrder())
                .questionType(item.getQuestionType())
                .questionContent(item.getQuestionContent())
                .options(item.getOptions())
                .correctOptionIndex(item.getCorrectOptionIndex())
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
                .map(assignmentMapper::toQuestionResponse)
                .toList();

        response.setQuestions(questionResponses);
        return response;
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


