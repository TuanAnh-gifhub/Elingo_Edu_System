package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.AssignmentQuestionType;
import org.rent.room.be.constant.SubmissionStatus;
import org.rent.room.be.dto.request.submission.CreateSubmissionRequest;
import org.rent.room.be.dto.request.submission.GradeSubmissionRequest;
import org.rent.room.be.dto.request.submission.SubmissionAnswerRequest;
import org.rent.room.be.dto.response.submission.SubmissionAnswerResponse;
import org.rent.room.be.dto.response.submission.SubmissionResponse;
import org.rent.room.be.entity.Assignment;
import org.rent.room.be.entity.AssignmentQuestion;
import org.rent.room.be.entity.AudioFile;
import org.rent.room.be.entity.Submission;
import org.rent.room.be.entity.SubmissionAnswer;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.SubmissionMapper;
import org.rent.room.be.repository.AssignmentQuestionRepository;
import org.rent.room.be.repository.AssignmentRepository;
import org.rent.room.be.repository.AudioFileRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.SubmissionAnswerRepository;
import org.rent.room.be.repository.SubmissionRepository;
import org.rent.room.be.service.SubmissionService;
import org.rent.room.be.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentQuestionRepository assignmentQuestionRepository;
    private final SubmissionAnswerRepository submissionAnswerRepository;
    private final AudioFileRepository audioFileRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserService userService;
    private final SubmissionMapper submissionMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public SubmissionResponse createSubmission(CreateSubmissionRequest request) {
        User student = userService.getCurrentUserEntity();
        if (!"STUDENT".equalsIgnoreCase(student.getRole().getRoleName())) {
            throw new AppException(ErrorCode.SUBMISSION_FORBIDDEN);
        }

        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        if (!assignment.isActive()) {
            throw new AppException(ErrorCode.ASSIGNMENT_NOT_ACTIVE);
        }

        if (assignment.getAccessPasswordHash() != null && !assignment.getAccessPasswordHash().isBlank()) {
            if (request.getAccessPassword() == null
                    || !passwordEncoder.matches(request.getAccessPassword(), assignment.getAccessPasswordHash())) {
                throw new AppException(ErrorCode.ASSIGNMENT_PASSWORD_INVALID);
            }
        }

        boolean autoSubmitted = Boolean.TRUE.equals(request.getAutoSubmitted());
        LocalDateTime attemptStartedAt = request.getAttemptStartedAt();

        if (assignment.getDeadline() != null) {
            LocalDateTime deadlineRef = attemptStartedAt != null ? attemptStartedAt : LocalDateTime.now();
            if (deadlineRef.isAfter(assignment.getDeadline())) {
                throw new AppException(ErrorCode.ASSIGNMENT_DEADLINE_EXCEEDED);
            }
        }

        if (assignment.getTimeLimitMinutes() != null) {
            if (attemptStartedAt == null) {
                throw new AppException(ErrorCode.SUBMISSION_ATTEMPT_STARTED_AT_REQUIRED);
            }
            LocalDateTime attemptEndedAt = attemptStartedAt.plusMinutes(assignment.getTimeLimitMinutes());
            if (LocalDateTime.now().isAfter(attemptEndedAt) && !autoSubmitted) {
                throw new AppException(ErrorCode.SUBMISSION_TIME_LIMIT_EXCEEDED);
            }
        }

        boolean enrolled = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                student.getUserId(),
                assignment.getClassRoom().getClassId()
        );
        if (!enrolled) {
            throw new AppException(ErrorCode.CLASS_JOIN_REQUIRED);
        }

        long usedAttempts = submissionRepository.countByAssignment_AssignmentIdAndStudent_UserId(
                assignment.getAssignmentId(),
                student.getUserId()
        );
        int maxAttempts = assignment.getMaxAttempts() == null ? 1 : assignment.getMaxAttempts();
        if (usedAttempts >= maxAttempts) {
            throw new AppException(ErrorCode.SUBMISSION_ATTEMPT_LIMIT_EXCEEDED);
        }

        List<AssignmentQuestion> questions = assignmentQuestionRepository
                .findByAssignment_AssignmentIdOrderByQuestionOrderAsc(assignment.getAssignmentId());

        Map<UUID, AssignmentQuestion> questionMap = new HashMap<>();
        for (AssignmentQuestion question : questions) {
            questionMap.put(question.getQuestionId(), question);
        }

        Map<UUID, SubmissionAnswerRequest> requestAnswerMap = new HashMap<>();
        for (SubmissionAnswerRequest answerRequest : request.getAnswers()) {
            if (!questionMap.containsKey(answerRequest.getQuestionId())) {
                throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_NOT_FOUND);
            }
            if (requestAnswerMap.put(answerRequest.getQuestionId(), answerRequest) != null) {
                throw new AppException(ErrorCode.SUBMISSION_ANSWER_INVALID);
            }
        }

        if (!autoSubmitted && requestAnswerMap.size() != questionMap.size()) {
            throw new AppException(ErrorCode.SUBMISSION_ANSWERS_INCOMPLETE);
        }

        Submission submission = Submission.builder()
                .assignment(assignment)
                .student(student)
                .attemptStartedAt(attemptStartedAt)
                .submittedAt(LocalDateTime.now())
                .attemptNumber((int) usedAttempts + 1)
                .autoSubmitted(autoSubmitted)
                .status(SubmissionStatus.SUBMITTED)
                .build();

        submission = submissionRepository.save(submission);

        List<SubmissionAnswer> answers = new ArrayList<>();
        for (AssignmentQuestion question : questions) {
            SubmissionAnswerRequest answerRequest = requestAnswerMap.get(question.getQuestionId());
            if (answerRequest == null) {
                answerRequest = SubmissionAnswerRequest.builder()
                        .questionId(question.getQuestionId())
                        .build();
            }
            answers.add(buildSubmissionAnswer(submission, questionMap, answerRequest, autoSubmitted));
        }

        submissionAnswerRepository.saveAll(answers);

        boolean hasManualQuestion = answers.stream().anyMatch(answer -> !answer.isAutoGraded());
        BigDecimal autoScore = answers.stream()
                .map(SubmissionAnswer::getScore)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        submission.setStatus(hasManualQuestion ? SubmissionStatus.IN_REVIEW : SubmissionStatus.GRADED);
        submission.setTotalScore(autoScore);

        return toResponse(submission, true);
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionById(UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        User currentUser = userService.getCurrentUserEntity();
        boolean isOwner = submission.getStudent().getUserId().equals(currentUser.getUserId());
        boolean isTeacher = submission.getAssignment().getTeacher().getUserId().equals(currentUser.getUserId());

        if (!isOwner && !isTeacher && !"ADMIN".equalsIgnoreCase(currentUser.getRole().getRoleName())) {
            throw new AppException(ErrorCode.SUBMISSION_FORBIDDEN);
        }

        return toResponse(submission, true);
    }

    @Override
    public SubmissionResponse getLatestMySubmissionByAssignment(UUID assignmentId) {
        User student = userService.getCurrentUserEntity();
        if (!"STUDENT".equalsIgnoreCase(student.getRole().getRoleName())) {
            throw new AppException(ErrorCode.SUBMISSION_FORBIDDEN);
        }

        return submissionRepository
                .findFirstByAssignment_AssignmentIdAndStudent_UserIdOrderByAttemptNumberDesc(
                        assignmentId,
                        student.getUserId()
                )
                .map(item -> toResponse(item, false))
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, SubmissionResponse> getLatestMySubmissionsByAssignmentIds(List<UUID> assignmentIds) {
        User student = userService.getCurrentUserEntity();
        if (!"STUDENT".equalsIgnoreCase(student.getRole().getRoleName())) {
            throw new AppException(ErrorCode.SUBMISSION_FORBIDDEN);
        }

        if (assignmentIds == null || assignmentIds.isEmpty()) {
            return Map.of();
        }

        List<UUID> distinctIds = assignmentIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctIds.isEmpty()) {
            return Map.of();
        }

        return submissionRepository.findLatestByStudentAndAssignmentIds(student.getUserId(), distinctIds)
                .stream()
                .collect(Collectors.toMap(
                        item -> item.getAssignment().getAssignmentId(),
                        item -> toResponse(item, false),
                        (left, right) -> left
                ));
    }

    @Override
    public PageResponse<SubmissionResponse> getSubmissionsByAssignment(UUID assignmentId, int page, int size) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        User currentUser = userService.getCurrentUserEntity();
        if (!assignment.getTeacher().getUserId().equals(currentUser.getUserId())) {
            throw new AppException(ErrorCode.SUBMISSION_FORBIDDEN);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
        Page<Submission> submissionPage = submissionRepository.findByAssignment_AssignmentId(assignmentId, pageable);
        Page<SubmissionResponse> mapped = submissionPage.map(item -> toResponse(item, false));

        return PageResponse.<SubmissionResponse>builder()
                .currentPage(page + 1)
                .totalPages(submissionPage.getTotalPages())
                .pageSize(submissionPage.getSize())
                .totalElements(submissionPage.getTotalElements())
                .data(mapped.getContent())
                .build();
    }

    @Override
    @Transactional
    public SubmissionResponse gradeSubmission(UUID submissionId, GradeSubmissionRequest request) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        User teacher = userService.getCurrentUserEntity();
        if (!submission.getAssignment().getTeacher().getUserId().equals(teacher.getUserId())) {
            throw new AppException(ErrorCode.SUBMISSION_FORBIDDEN);
        }

        List<SubmissionAnswer> answers = submissionAnswerRepository
                .findBySubmission_SubmissionIdOrderByQuestion_QuestionOrderAsc(submissionId);

        Map<UUID, SubmissionAnswer> answerMap = new HashMap<>();
        for (SubmissionAnswer answer : answers) {
            answerMap.put(answer.getAnswerId(), answer);
        }

        if (request.getAnswers() != null) {
            request.getAnswers().forEach(item -> {
                SubmissionAnswer answer = answerMap.get(item.getAnswerId());
                if (answer == null) {
                    throw new AppException(ErrorCode.SUBMISSION_ANSWER_NOT_FOUND);
                }
                if (item.getScore().compareTo(answer.getQuestion().getMaxScore()) > 0) {
                    throw new AppException(ErrorCode.SUBMISSION_GRADE_INVALID);
                }
                answer.setScore(item.getScore());
                answer.setFeedback(item.getFeedback());
            });
        }

        submissionAnswerRepository.saveAll(answers);

        BigDecimal total = answers.stream()
                .map(SubmissionAnswer::getScore)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        submission.setTeacherFeedback(request.getTeacherFeedback());
        submission.setTotalScore(total);
        submission.setStatus(SubmissionStatus.GRADED);

        return toResponse(submission, true);
    }

    private SubmissionAnswer buildSubmissionAnswer(
            Submission submission,
            Map<UUID, AssignmentQuestion> questionMap,
            SubmissionAnswerRequest request,
            boolean allowBlankOnTimeout
    ) {
        AssignmentQuestion question = questionMap.get(request.getQuestionId());
        if (question == null) {
            throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_NOT_FOUND);
        }

        AudioFile audioFile = null;
        if (request.getAudioFileId() != null) {
            audioFile = audioFileRepository.findById(request.getAudioFileId())
                    .orElseThrow(() -> new AppException(ErrorCode.AUDIO_FILE_NOT_FOUND));
        }

        SubmissionAnswer answer = SubmissionAnswer.builder()
                .submission(submission)
                .question(question)
                .answerText(request.getAnswerText())
                .selectedOptionIndex(resolveSelectedOptionIndexes(request).stream().findFirst().orElse(null))
                .selectedOptionIndexes(resolveSelectedOptionIndexes(request))
                .audioFile(audioFile)
                .audioUrl(audioFile != null ? audioFile.getAudioUrl() : null)
                .transcriptText(audioFile != null ? audioFile.getTranscriptText() : null)
                .build();

        autoGradeIfPossible(answer, allowBlankOnTimeout);
        return answer;
    }

    private void autoGradeIfPossible(SubmissionAnswer answer, boolean allowBlankOnTimeout) {
        AssignmentQuestion question = answer.getQuestion();

        if (question.getQuestionType() == AssignmentQuestionType.MULTIPLE_CHOICE) {
            List<Integer> selectedIndexes = resolveSelectedOptionIndexes(answer);

            if (selectedIndexes.isEmpty()) {
                if (allowBlankOnTimeout) {
                    answer.setScore(BigDecimal.ZERO);
                    answer.setAutoGraded(true);
                    return;
                }
                throw new AppException(ErrorCode.SUBMISSION_ANSWER_INVALID);
            }

            int optionsSize = question.getOptions() == null ? 0 : question.getOptions().size();
            boolean hasOutOfRangeSelection = selectedIndexes.stream()
                    .anyMatch(index -> index < 0 || index >= optionsSize);
            if (hasOutOfRangeSelection) {
                throw new AppException(ErrorCode.SUBMISSION_ANSWER_INVALID);
            }

            List<Integer> correctIndexes = resolveCorrectOptionIndexes(question);
            if (correctIndexes.isEmpty()) {
                throw new AppException(ErrorCode.ASSIGNMENT_QUESTION_INVALID);
            }

            Set<Integer> selectedSet = new HashSet<>(selectedIndexes);
            Set<Integer> correctSet = new HashSet<>(correctIndexes);

            boolean correct = selectedSet.equals(correctSet);

            answer.setScore(correct ? question.getMaxScore() : BigDecimal.ZERO);
            answer.setAutoGraded(true);
            return;
        }

        if (question.getQuestionType() == AssignmentQuestionType.AUDIO && answer.getAudioFile() == null) {
            if (allowBlankOnTimeout) {
                answer.setScore(BigDecimal.ZERO);
                answer.setAutoGraded(true);
                return;
            }
            throw new AppException(ErrorCode.SUBMISSION_ANSWER_INVALID);
        }

        if (question.getQuestionType() == AssignmentQuestionType.TEXT
                && (answer.getAnswerText() == null || answer.getAnswerText().isBlank())) {
            if (allowBlankOnTimeout) {
                answer.setScore(BigDecimal.ZERO);
                answer.setAutoGraded(true);
                return;
            }
            throw new AppException(ErrorCode.SUBMISSION_ANSWER_INVALID);
        }

        answer.setAutoGraded(false);
    }

    private List<Integer> resolveSelectedOptionIndexes(SubmissionAnswerRequest request) {
        List<Integer> indexes = request.getSelectedOptionIndexes();
        if (indexes == null || indexes.isEmpty()) {
            if (request.getSelectedOptionIndex() == null) {
                return List.of();
            }
            indexes = List.of(request.getSelectedOptionIndex());
        }

        List<Integer> normalized = indexes.stream()
                .filter(Objects::nonNull)
                .toList();

        if (normalized.size() != indexes.size()) {
            throw new AppException(ErrorCode.SUBMISSION_ANSWER_INVALID);
        }

        LinkedHashSet<Integer> uniqueOrdered = new LinkedHashSet<>(normalized);
        List<Integer> result = new ArrayList<>(uniqueOrdered);
        Collections.sort(result);
        return result;
    }

    private List<Integer> resolveSelectedOptionIndexes(SubmissionAnswer answer) {
        List<Integer> indexes = answer.getSelectedOptionIndexes();
        if (indexes == null || indexes.isEmpty()) {
            if (answer.getSelectedOptionIndex() == null) {
                return List.of();
            }
            indexes = List.of(answer.getSelectedOptionIndex());
        }

        LinkedHashSet<Integer> uniqueOrdered = new LinkedHashSet<>(indexes);
        List<Integer> result = new ArrayList<>(uniqueOrdered);
        Collections.sort(result);
        return result;
    }

    private List<Integer> resolveCorrectOptionIndexes(AssignmentQuestion question) {
        List<Integer> indexes = question.getCorrectOptionIndexes();
        if (indexes == null || indexes.isEmpty()) {
            if (question.getCorrectOptionIndex() == null) {
                return List.of();
            }
            indexes = List.of(question.getCorrectOptionIndex());
        }

        LinkedHashSet<Integer> uniqueOrdered = new LinkedHashSet<>(indexes);
        List<Integer> result = new ArrayList<>(uniqueOrdered);
        Collections.sort(result);
        return result;
    }

    private SubmissionResponse toResponse(Submission submission, boolean includeAnswers) {
        SubmissionResponse response = submissionMapper.toResponse(submission);

        if (!includeAnswers) {
            response.setAnswers(List.of());
            return response;
        }

        List<SubmissionAnswer> answers = submissionAnswerRepository
                .findBySubmission_SubmissionIdOrderByQuestion_QuestionOrderAsc(submission.getSubmissionId());

        List<SubmissionAnswerResponse> answerResponses = answers.stream()
                .sorted(Comparator.comparing(item -> item.getQuestion().getQuestionOrder()))
                .map(submissionMapper::toAnswerResponse)
                .toList();

        response.setAnswers(answerResponses);
        return response;
    }
}


