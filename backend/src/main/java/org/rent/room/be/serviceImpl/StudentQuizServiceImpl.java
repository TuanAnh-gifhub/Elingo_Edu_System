package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.dto.request.studentQuiz.SubmitQuizAnswerRequest;
import org.rent.room.be.dto.request.studentQuiz.SubmitQuizRequest;
import org.rent.room.be.dto.response.studentQuiz.*;
import org.rent.room.be.entity.*;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.QuestionRepository;
import org.rent.room.be.repository.QuizAttemptRepository;
import org.rent.room.be.repository.QuizRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.security.CustomUserDetails;
import org.rent.room.be.security.SecurityUtils;
import org.rent.room.be.service.StudentQuizService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentQuizServiceImpl implements StudentQuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public StudentQuizTakeResponse getQuizForTake(UUID quizId) {
        CustomUserDetails user = SecurityUtils.requireCurrentUser();
        Quiz quiz = loadQuizWithAccess(quizId, user.getUserId());

        int max = effectiveMaxAttempts(quiz);
        int used = (int) quizAttemptRepository.countByQuiz_QuizIdAndStudent_UserId(quizId, user.getUserId());
        if (used >= max) {
            throw new AppException(ErrorCode.QUIZ_ATTEMPTS_EXHAUSTED);
        }

        List<Question> questions = questionRepository.findByQuiz_QuizIdWithOptions(quizId);

        List<StudentQuizQuestionResponse> questionResponses = questions.stream()
                .map(this::toStudentQuestion)
                .toList();

        return StudentQuizTakeResponse.builder()
                .quizId(quiz.getQuizId())
                .courseId(quiz.getCourse().getCourseId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .maxAttempts(max)
                .attemptsUsed(used)
                .attemptsRemaining(max - used)
                .questions(questionResponses)
                .build();
    }

    @Override
    @Transactional
    public QuizSubmitResultResponse submitQuiz(UUID quizId, SubmitQuizRequest request) {
        CustomUserDetails user = SecurityUtils.requireCurrentUser();
        Quiz quiz = loadQuizWithAccess(quizId, user.getUserId());

        int max = effectiveMaxAttempts(quiz);
        long used = quizAttemptRepository.countByQuiz_QuizIdAndStudent_UserId(quizId, user.getUserId());
        if (used >= max) {
            throw new AppException(ErrorCode.QUIZ_ATTEMPTS_EXHAUSTED);
        }

        List<Question> questions = questionRepository.findByQuiz_QuizIdWithOptions(quizId);
        if (questions.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_QUIZ_SUBMISSION);
        }

        Set<UUID> validQuestionIds = questions.stream().map(Question::getQuestionId).collect(Collectors.toSet());

        Map<UUID, SubmitQuizAnswerRequest> answerByQuestion = new HashMap<>();
        if (request.getAnswers() == null) {
            throw new AppException(ErrorCode.INVALID_QUIZ_SUBMISSION);
        }
        for (SubmitQuizAnswerRequest ansReq : request.getAnswers()) {
            if (ansReq.getQuestionId() == null || answerByQuestion.containsKey(ansReq.getQuestionId())) {
                throw new AppException(ErrorCode.INVALID_QUIZ_SUBMISSION);
            }
            if (!validQuestionIds.contains(ansReq.getQuestionId())) {
                throw new AppException(ErrorCode.INVALID_QUIZ_SUBMISSION);
            }
            answerByQuestion.put(ansReq.getQuestionId(), ansReq);
        }
        if (answerByQuestion.size() != questions.size()) {
            throw new AppException(ErrorCode.INVALID_QUIZ_SUBMISSION);
        }

        List<QuizAttemptAnswer> attemptAnswers = new ArrayList<>();
        List<QuizSubmitQuestionResultResponse> details = new ArrayList<>();
        int correctCount = 0;

        User student = userRepository.findById(user.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<Question> orderedQuestions = new ArrayList<>(questions);
        orderedQuestions.sort(Comparator.comparing(
                Question::getOrderIndex,
                Comparator.nullsLast(Comparator.naturalOrder())));

        for (Question question : orderedQuestions) {
            SubmitQuizAnswerRequest ansReq = answerByQuestion.get(question.getQuestionId());

            Set<UUID> selected = ansReq.getSelectedOptionIds() == null
                    ? new HashSet<>()
                    : new HashSet<>(ansReq.getSelectedOptionIds());

            Set<UUID> validOptionIds = question.getOptions().stream()
                    .map(QuestionOption::getOptionId)
                    .collect(Collectors.toSet());
            for (UUID oid : selected) {
                if (!validOptionIds.contains(oid)) {
                    throw new AppException(ErrorCode.INVALID_QUIZ_SUBMISSION);
                }
            }

            Set<UUID> correctIds = question.getOptions().stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                    .map(QuestionOption::getOptionId)
                    .collect(Collectors.toSet());

            boolean isCorrect = selected.equals(correctIds);
            if (isCorrect) {
                correctCount++;
            }

            QuizAttemptAnswer attemptAnswer = QuizAttemptAnswer.builder()
                    .question(question)
                    .correct(isCorrect)
                    .selectedOptionIds(new HashSet<>(selected))
                    .build();
            attemptAnswers.add(attemptAnswer);

            details.add(QuizSubmitQuestionResultResponse.builder()
                    .questionId(question.getQuestionId())
                    .correct(isCorrect)
                    .selectedOptionIds(new ArrayList<>(selected))
                    .correctOptionIds(new ArrayList<>(correctIds))
                    .build());
        }

        int total = questions.size();
        BigDecimal score = BigDecimal.valueOf(correctCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .student(student)
                .submittedAt(LocalDateTime.now())
                .score(score)
                .correctCount(correctCount)
                .totalQuestions(total)
                .answers(new ArrayList<>())
                .build();

        for (QuizAttemptAnswer aa : attemptAnswers) {
            aa.setAttempt(attempt);
            attempt.getAnswers().add(aa);
        }

        QuizAttempt saved = quizAttemptRepository.save(attempt);

        return QuizSubmitResultResponse.builder()
                .quizAttemptId(saved.getQuizAttemptId())
                .quizId(quizId)
                .score(saved.getScore())
                .correctCount(saved.getCorrectCount())
                .totalQuestions(saved.getTotalQuestions())
                .submittedAt(saved.getSubmittedAt())
                .details(details)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptSummaryResponse> getMyAttempts(UUID quizId) {
        CustomUserDetails user = SecurityUtils.requireCurrentUser();
        loadQuizWithAccess(quizId, user.getUserId());

        return quizAttemptRepository
                .findByQuiz_QuizIdAndStudent_UserIdOrderBySubmittedAtDesc(quizId, user.getUserId())
                .stream()
                .map(a -> QuizAttemptSummaryResponse.builder()
                        .quizAttemptId(a.getQuizAttemptId())
                        .score(a.getScore())
                        .correctCount(a.getCorrectCount())
                        .totalQuestions(a.getTotalQuestions())
                        .submittedAt(a.getSubmittedAt())
                        .build())
                .toList();
    }

    private Quiz loadQuizWithAccess(UUID quizId, UUID studentId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        UUID classId = quiz.getCourse().getClassRoom().getClassId();
        if (!enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(studentId, classId)) {
            throw new AppException(ErrorCode.QUIZ_ACCESS_DENIED);
        }
        return quiz;
    }

    private static int effectiveMaxAttempts(Quiz quiz) {
        Integer m = quiz.getMaxAttempts();
        if (m == null || m < 1) {
            return 1;
        }
        return m;
    }

    private StudentQuizQuestionResponse toStudentQuestion(Question q) {
        List<StudentQuizOptionResponse> opts = q.getOptions().stream()
                .map(o -> StudentQuizOptionResponse.builder()
                        .optionId(o.getOptionId())
                        .optionText(o.getOptionText())
                        .orderIndex(o.getOrderIndex())
                        .build())
                .toList();

        return StudentQuizQuestionResponse.builder()
                .questionId(q.getQuestionId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .orderIndex(q.getOrderIndex())
                .options(opts)
                .build();
    }
}
