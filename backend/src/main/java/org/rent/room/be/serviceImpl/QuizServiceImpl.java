package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.QuestionType;
import org.rent.room.be.dto.request.quiz.CreateQuizRequest;
import org.rent.room.be.dto.request.quiz.UpdateQuizRequest;
import org.rent.room.be.dto.response.quiz.QuizImportResponse;
import org.rent.room.be.dto.response.quiz.QuizResponse;
import org.rent.room.be.entity.Course;
import org.rent.room.be.entity.Question;
import org.rent.room.be.entity.QuestionOption;
import org.rent.room.be.entity.Quiz;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.QuizMapper;
import org.rent.room.be.repository.CourseRepository;
import org.rent.room.be.repository.QuestionRepository;
import org.rent.room.be.repository.QuizRepository;
import org.rent.room.be.service.QuizService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private static final int COL_QUESTION = 0;      // A
    private static final int COL_QUESTION_TYPE = 1; // B
    private static final int COL_FIRST_OPTION = 2;   // C - options bắt đầu từ đây
    private static final int COL_LAST_OPTION = 23;   // X - options kết thúc trước cột Y
    private static final int COL_CORRECT_ANSWER = 24; // Y

    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;
    private final QuestionRepository questionRepository;
    private final QuizMapper quizMapper;

    @Override
    @Transactional
    public QuizResponse createQuiz(CreateQuizRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        int maxAttempts = resolveMaxAttemptsForCreate(request.getMaxAttempts());

        Quiz quiz = Quiz.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .maxAttempts(maxAttempts)
                .build();

        return quizMapper.toResponse(quizRepository.save(quiz));
    }

    @Override
    public QuizResponse getQuiz(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        return quizMapper.toResponse(quiz);
    }

    @Override
    public PageResponse<QuizResponse> getQuizzes(UUID courseId, int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Quiz> pageData;
        if (courseId != null) {
            pageData = quizRepository.findByCourse_CourseId(courseId, pageable);
        } else {
            pageData = quizRepository.findAll(pageable);
        }

        Page<QuizResponse> responsePage = pageData.map(quizMapper::toResponse);

        return PageResponse.<QuizResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(responsePage.getContent())
                .build();
    }

    @Override
    @Transactional
    public QuizResponse updateQuiz(UUID quizId, UpdateQuizRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        if (request.getTitle() != null) {
            quiz.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            quiz.setDescription(request.getDescription());
        }
        if (request.getMaxAttempts() != null) {
            if (request.getMaxAttempts() < 1) {
                throw new AppException(ErrorCode.QUIZ_INVALID_MAX_ATTEMPTS);
            }
            quiz.setMaxAttempts(request.getMaxAttempts());
        }

        return quizMapper.toResponse(quizRepository.save(quiz));
    }

    /** Tạo quiz: không gửi maxAttempts → mặc định 1; gửi nhỏ hơn 1 → lỗi. */
    private static int resolveMaxAttemptsForCreate(Integer value) {
        if (value == null) {
            return 1;
        }
        if (value < 1) {
            throw new AppException(ErrorCode.QUIZ_INVALID_MAX_ATTEMPTS);
        }
        return value;
    }

    @Override
    @Transactional
    public void deleteQuiz(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        quizRepository.delete(quiz);
    }

    @Override
    @Transactional
    public QuizImportResponse importQuestionsFromExcel(UUID quizId, MultipartFile file) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_EXCEL_FORMAT);
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            throw new AppException(ErrorCode.INVALID_EXCEL_FORMAT);
        }

        List<String> errors = new ArrayList<>();
        int importedCount = 0;
        int totalRows = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new AppException(ErrorCode.INVALID_EXCEL_FORMAT);
            }

            int lastRowNum = sheet.getLastRowNum();
            totalRows = lastRowNum;

            for (int rowIndex = 1; rowIndex <= lastRowNum; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null) continue;

                try {
                    String questionText = getCellStringValue(row.getCell(COL_QUESTION));
                    if (questionText == null || questionText.isBlank()) {
                        errors.add("Dòng " + (rowIndex + 1) + ": Thiếu câu hỏi (cột A)");
                        continue;
                    }

                    String typeStr = getCellStringValue(row.getCell(COL_QUESTION_TYPE));
                    QuestionType questionType = parseQuestionType(typeStr, rowIndex + 1, errors);
                    if (questionType == null) continue;

                    String correctAnswerStr = getCellStringValue(row.getCell(COL_CORRECT_ANSWER));
                    List<String> optionTexts = new ArrayList<>();
                    for (int col = COL_FIRST_OPTION; col <= COL_LAST_OPTION; col++) {
                        String opt = getCellStringValue(row.getCell(col));
                        if (opt != null && !opt.isBlank()) {
                            optionTexts.add(opt.trim());
                        }
                    }

                    if (optionTexts.isEmpty()) {
                        errors.add("Dòng " + (rowIndex + 1) + ": Thiếu đáp án (các cột từ C đến X)");
                        continue;
                    }

                    Set<Integer> correctIndices = parseCorrectAnswerIndices(correctAnswerStr, optionTexts.size(), questionType, rowIndex + 1, errors);
                    if (correctIndices == null) continue;

                    Question question = Question.builder()
                            .quiz(quiz)
                            .questionText(questionText.trim())
                            .questionType(questionType)
                            .orderIndex(rowIndex)
                            .build();

                    List<QuestionOption> optionList = new ArrayList<>();
                    for (int i = 0; i < optionTexts.size(); i++) {
                        QuestionOption option = QuestionOption.builder()
                                .question(question)
                                .optionText(optionTexts.get(i))
                                .isCorrect(correctIndices.contains(i + 1))
                                .orderIndex(i + 1)
                                .build();
                        optionList.add(option);
                    }
                    question.setOptions(optionList);
                    questionRepository.save(question);
                    importedCount++;

                } catch (Exception e) {
                    errors.add("Dòng " + (rowIndex + 1) + ": " + e.getMessage());
                }
            }

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.EXCEL_IMPORT_ERROR);
        }

        return QuizImportResponse.builder()
                .importedCount(importedCount)
                .totalRows(totalRows)
                .errors(errors.isEmpty() ? null : errors)
                .build();
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> cell.getNumericCellValue() == (long) cell.getNumericCellValue()
                    ? String.valueOf((long) cell.getNumericCellValue())
                    : String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    yield cell.toString();
                }
            }
            default -> cell.toString();
        };
    }

    private QuestionType parseQuestionType(String typeStr, int rowNum, List<String> errors) {
        if (typeStr == null || typeStr.isBlank()) {
            errors.add("Dòng " + rowNum + ": Thiếu loại câu hỏi (cột B). Dùng SINGLE_CHOICE hoặc MULTIPLE_CHOICE");
            return null;
        }
        String normalized = typeStr.trim().toUpperCase().replace(" ", "_");
        try {
            return QuestionType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            errors.add("Dòng " + rowNum + ": Loại câu hỏi không hợp lệ '" + typeStr + "'. Dùng SINGLE_CHOICE hoặc MULTIPLE_CHOICE");
            return null;
        }
    }

    /**
     * Parse cột Y: chữ cái A,B,C... tương ứng option 1,2,3...
     * Ví dụ: "A,B,C" = 3 đáp án đúng là option 1, 2, 3
     */
    private Set<Integer> parseCorrectAnswerIndices(String correctAnswerStr, int optionCount, QuestionType questionType, int rowNum, List<String> errors) {
        if (correctAnswerStr == null || correctAnswerStr.isBlank()) {
            errors.add("Dòng " + rowNum + ": Thiếu đáp án đúng (cột Y)");
            return null;
        }

        Set<Integer> indices = new HashSet<>();
        for (String part : correctAnswerStr.split("[,;]+")) {
            part = part.trim().toUpperCase();
            if (part.isEmpty()) continue;
            if (part.length() != 1 || part.charAt(0) < 'A' || part.charAt(0) > 'Z') {
                errors.add("Dòng " + rowNum + ": Đáp án đúng không hợp lệ '" + part + "'. Dùng chữ cái (ví dụ: A hoặc A,B,C)");
                return null;
            }
            int idx = part.charAt(0) - 'A' + 1; // A=1, B=2, C=3, ...
            if (idx < 1 || idx > optionCount) {
                errors.add("Dòng " + rowNum + ": Đáp án đúng '" + part + "' vượt quá số đáp án (" + optionCount + "). Cột C=A, D=B, E=C...");
                return null;
            }
            indices.add(idx);
        }

        if (indices.isEmpty()) {
            errors.add("Dòng " + rowNum + ": Thiếu đáp án đúng (cột Y)");
            return null;
        }

        if (questionType == QuestionType.SINGLE_CHOICE && indices.size() > 1) {
            errors.add("Dòng " + rowNum + ": SINGLE_CHOICE chỉ được có 1 đáp án đúng");
            return null;
        }

        return indices;
    }
}
