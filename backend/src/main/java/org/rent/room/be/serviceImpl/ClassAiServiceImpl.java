package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.rent.room.be.dto.response.ai.ClassAiChatResponse;
import org.rent.room.be.dto.response.ai.ClassAiHistoryMessageResponse;
import org.rent.room.be.entity.ClassAiChatMessage;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Course;
import org.rent.room.be.entity.Question;
import org.rent.room.be.entity.QuestionOption;
import org.rent.room.be.entity.Quiz;
import org.rent.room.be.entity.QuizAttempt;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.properties.OllamaProperties;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.ClassAiChatMessageRepository;
import org.rent.room.be.repository.CourseRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.QuestionRepository;
import org.rent.room.be.repository.QuizAttemptRepository;
import org.rent.room.be.repository.QuizRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.ClassAiService;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PushbackInputStream;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.zip.GZIPInputStream;

@Service
@RequiredArgsConstructor
public class ClassAiServiceImpl implements ClassAiService {

    private static final int MAX_CONTEXT_CHARS = 18_000;
    private static final int MAX_MESSAGE_CHARS = 2_000;
    private static final int MAX_PARSED_FILES = 5;
    private static final int MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;
    private static final String ROLE_USER = "user";
    private static final String ROLE_ASSISTANT = "assistant";
    private static final Pattern CJK_PATTERN = Pattern.compile("[\\p{IsHan}\\p{IsHiragana}\\p{IsKatakana}]");
    private static final String VIETNAMESE_FALLBACK_ANSWER = "Xin lỗi, tôi chỉ có thể trả lời bằng tiếng Việt về nội dung liên quan đến lớp học này.";

    private final EnrollmentRepository enrollmentRepository;
    private final ClassRoomRepository classRoomRepository;
    private final ClassAiChatMessageRepository classAiChatMessageRepository;
    private final CourseRepository courseRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserRepository userRepository;
    private final WebClient.Builder webClientBuilder;
    private final OllamaProperties ollamaProperties;

    @Override
    @Transactional
    public ClassAiChatResponse chatWithClassAssistant(UUID classId, UUID studentId, String message) {
        ClassRoom classRoom = loadAuthorizedClassRoom(classId, studentId);
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<Course> courses = courseRepository.findByClassRoom_ClassIdOrderByOrderIndexAsc(classId);
        List<UUID> courseIds = courses.stream().map(Course::getCourseId).toList();
        List<Quiz> quizzes = courseIds.isEmpty() ? List.of() : quizRepository.findByCourse_CourseIdIn(courseIds);

        Set<UUID> attemptedQuizIds = loadAttemptedQuizIds(studentId, quizzes);

        String userMessage = sanitizeInput(message);
        persistChatMessage(classRoom, student, ROLE_USER, userMessage);

        String context = buildContext(classRoom, courses, quizzes, attemptedQuizIds, userMessage);
        String answer = normalizeVietnameseAnswer(callOllama(userMessage, context), userMessage, context);

        if (answer.isBlank()) {
            answer = VIETNAMESE_FALLBACK_ANSWER;
        }

        persistChatMessage(classRoom, student, ROLE_ASSISTANT, answer);

        return ClassAiChatResponse.builder()
                .answer(answer)
                .sources(collectSourceUrls(courses))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassAiHistoryMessageResponse> getChatHistory(UUID classId, UUID studentId) {
        loadAuthorizedClassRoom(classId, studentId);
        return classAiChatMessageRepository
                .findByClassRoomClassIdAndStudentUserIdOrderByCreatedAtAsc(classId, studentId)
                .stream()
                .map(item -> ClassAiHistoryMessageResponse.builder()
                        .role(item.getSenderRole())
                        .content(item.getContent())
                        .createdAt(item.getCreatedAt())
                        .build())
                .toList();
    }

    private ClassRoom loadAuthorizedClassRoom(UUID classId, UUID studentId) {
        if (!enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(studentId, classId)) {
            throw new AppException(ErrorCode.CLASS_AI_ACCESS_DENIED);
        }

        return classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
    }

    private void persistChatMessage(ClassRoom classRoom, User student, String role, String content) {
        String normalizedContent = Objects.toString(content, "").trim();
        if (normalizedContent.isBlank()) {
            return;
        }

        classAiChatMessageRepository.save(
                ClassAiChatMessage.builder()
                        .classRoom(classRoom)
                        .student(student)
                        .senderRole(role)
                        .content(normalizedContent)
                        .build()
        );
    }

    private Set<UUID> loadAttemptedQuizIds(UUID studentId, List<Quiz> quizzes) {
        if (quizzes.isEmpty()) {
            return Set.of();
        }

        List<UUID> quizIds = quizzes.stream().map(Quiz::getQuizId).toList();
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudent_UserIdAndQuiz_QuizIdIn(studentId, quizIds);
        return attempts.stream()
                .map(attempt -> attempt.getQuiz().getQuizId())
                .collect(Collectors.toCollection(HashSet::new));
    }

    private static String sanitizeInput(String message) {
        String sanitized = Objects.toString(message, "").trim();
        if (sanitized.length() > MAX_MESSAGE_CHARS) {
            return sanitized.substring(0, MAX_MESSAGE_CHARS);
        }
        return sanitized;
    }

    private String buildContext(
            ClassRoom classRoom,
            List<Course> courses,
            List<Quiz> quizzes,
            Set<UUID> attemptedQuizIds,
            String userMessage
    ) {
        StringBuilder builder = new StringBuilder();
        builder.append("ROLE: Bạn là trợ giảng AI duy nhất của lớp học này.\n")
                .append("QUY TẮC BẮT BUỘC:\n")
                .append("1) CHỈ trả lời thông tin liên quan đến lớp học, bài học, tài liệu và quiz của lớp này.\n")
                .append("2) Nếu câu hỏi không liên quan, trả lời đúng một câu: Tôi chỉ có thể trả lời những nội dung liên quan đến chủ đề lớp học này.\n")
                .append("3) Không tiết lộ đáp án quiz nếu học sinh chưa làm quiz đó.\n")
                .append("4) Trả lời bằng tiếng Việt, rõ ràng, ngắn gọn, thân thiện.\n")
                .append("5) CẤM trả lời bằng ngôn ngữ khác tiếng Việt (không được dùng tiếng Trung, Nhật, Hàn).\n")
                .append("6) Nếu không chắc chắn, vẫn phải trả lời bằng tiếng Việt và nêu rõ giới hạn thông tin.\n\n")
                .append("THÔNG TIN LỚP:\n")
                .append("- Tên lớp: ").append(nullToDash(classRoom.getClassName())).append("\n")
                .append("- Mô tả: ").append(limit(nullToDash(classRoom.getDescription()), 1200)).append("\n")
                .append("- Lịch học: ").append(nullToDash(classRoom.getSchedule())).append("\n")
                .append("- Giáo viên: ").append(classRoom.getTeacher() == null ? "-" : nullToDash(classRoom.getTeacher().getUserName())).append("\n\n")
                .append("DANH SÁCH BÀI HỌC:\n");

        int parsedFileCount = 0;
        for (Course course : courses) {
            builder.append("* Bai ")
                    .append(course.getOrderIndex() == null ? "?" : course.getOrderIndex())
                    .append(": ")
                    .append(nullToDash(course.getTitle()))
                    .append("\n  Mo ta: ")
                    .append(limit(nullToDash(course.getDescription()), 700))
                    .append("\n");

            List<String> fileUrls = course.getFileUrls() == null ? List.of() : course.getFileUrls();
            if (!fileUrls.isEmpty()) {
                builder.append("  Tài liệu:\n");
                for (String fileUrl : fileUrls) {
                    builder.append("  - ").append(fileUrl).append("\n");
                    if (parsedFileCount < MAX_PARSED_FILES) {
                        String extracted = extractSupportedFileText(fileUrl);
                        if (!extracted.isBlank()) {
                            builder.append("    Tóm tắt nội dung tài liệu: ")
                                    .append(limit(extracted, 1500))
                                    .append("\n");
                            parsedFileCount++;
                        }
                    }
                    if (builder.length() > MAX_CONTEXT_CHARS) {
                        break;
                    }
                }
            }

            if (builder.length() > MAX_CONTEXT_CHARS) {
                break;
            }
        }

        builder.append("\nQUIZ:\n");
        List<Quiz> orderedQuizzes = new ArrayList<>(quizzes);
        orderedQuizzes.sort(Comparator.comparing(Quiz::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));
        for (Quiz quiz : orderedQuizzes) {
            boolean attempted = attemptedQuizIds.contains(quiz.getQuizId());
            builder.append("- Quiz: ").append(nullToDash(quiz.getTitle()))
                    .append(" | đã làm: ").append(attempted ? "có" : "chưa")
                    .append("\n");

            if (attempted) {
                builder.append("  Mô tả quiz: ").append(limit(nullToDash(quiz.getDescription()), 500)).append("\n");
                appendAttemptedQuizQa(builder, quiz);
            } else {
                builder.append("  KHÔNG được cung cấp đáp án/nội dung chi tiết cho quiz này.\n");
            }
            if (builder.length() > MAX_CONTEXT_CHARS) {
                break;
            }
        }

        builder.append("\nCÂU HỎI HỌC SINH: ").append(userMessage).append("\n");
        return limit(builder.toString(), MAX_CONTEXT_CHARS);
    }

    private void appendAttemptedQuizQa(StringBuilder builder, Quiz quiz) {
        List<Question> questions = questionRepository.findByQuiz_QuizIdWithOptions(quiz.getQuizId());
        if (questions.isEmpty()) {
            return;
        }

        builder.append("  Câu hỏi & đáp án (chỉ vì học sinh đã làm quiz này):\n");
        for (Question question : questions) {
            builder.append("   - Q: ").append(limit(nullToDash(question.getQuestionText()), 300)).append("\n");
            List<QuestionOption> options = question.getOptions() == null ? List.of() : question.getOptions();
            for (QuestionOption option : options) {
                builder.append("     + ")
                        .append(limit(nullToDash(option.getOptionText()), 220))
                        .append(Boolean.TRUE.equals(option.getIsCorrect()) ? " [ĐÚNG]" : "")
                        .append("\n");
            }
            if (builder.length() > MAX_CONTEXT_CHARS) {
                break;
            }
        }
    }

    private String callOllama(String userMessage, String context) {
        try {
            WebClient webClient = webClientBuilder.baseUrl(ollamaProperties.getBaseUrl()).build();
            Map<String, Object> payload = Map.of(
                    "model", ollamaProperties.getModel(),
                    "stream", false,
                    "prompt", context + "\n\nTrả lời cho học sinh BẰNG TIẾNG VIỆT: " + userMessage
            );

            Map<String, Object> response = webClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(Math.max(10, ollamaProperties.getTimeoutSeconds())))
                    .block();

            if (response == null) {
                throw new AppException(ErrorCode.CLASS_AI_UNAVAILABLE);
            }

            Object value = response.get("response");
            return value == null ? "" : String.valueOf(value).trim();
        } catch (AppException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AppException(ErrorCode.CLASS_AI_UNAVAILABLE);
        }
    }

    private String normalizeVietnameseAnswer(String answer, String userMessage, String context) {
        String normalized = Objects.toString(answer, "").trim();
        if (normalized.isBlank()) {
            return "";
        }

        if (!isLikelyNonVietnamese(normalized)) {
            return normalized;
        }

        String rewritePrompt = "Hãy viết lại câu trả lời sau HOÀN TOÀN bằng tiếng Việt, giữ đúng nội dung, không thêm thông tin mới:\n"
                + "Câu hỏi học sinh: " + userMessage + "\n"
                + "Câu trả lời cần viết lại: " + normalized;

        String rewritten = Objects.toString(callOllama(rewritePrompt, context), "").trim();
        if (!rewritten.isBlank() && !isLikelyNonVietnamese(rewritten)) {
            return rewritten;
        }

        return VIETNAMESE_FALLBACK_ANSWER;
    }

    private static boolean isLikelyNonVietnamese(String text) {
        return CJK_PATTERN.matcher(Objects.toString(text, "")).find();
    }

    private String extractSupportedFileText(String fileUrl) {
        try {
            URI uri = URI.create(fileUrl);
            String extension = resolveExtension(uri.getPath());
            if (!("pdf".equals(extension) || "docx".equals(extension) || "pptx".equals(extension) || "txt".equals(extension))) {
                return "";
            }

            byte[] bytes = downloadWithLimit(uri.toURL());
            if (bytes.length == 0) {
                return "";
            }

            return switch (extension) {
                case "pdf" -> extractPdf(bytes);
                case "docx" -> extractDocx(bytes);
                case "pptx" -> extractPptx(bytes);
                default -> new String(bytes, StandardCharsets.UTF_8);
            };
        } catch (Exception exception) {
            return "";
        }
    }

    private static String extractPdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private static String extractDocx(byte[] bytes) throws IOException {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(bytes))) {
            StringBuilder builder = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                String text = paragraph.getText();
                if (text != null && !text.isBlank()) {
                    builder.append(text).append("\n");
                }
                if (builder.length() > 6_000) {
                    break;
                }
            }
            return builder.toString();
        }
    }

    private static String extractPptx(byte[] bytes) throws IOException {
        try (XMLSlideShow slideShow = new XMLSlideShow(new ByteArrayInputStream(bytes))) {
            StringBuilder builder = new StringBuilder();
            for (XSLFSlide slide : slideShow.getSlides()) {
                for (XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof XSLFTextShape textShape) {
                        String text = textShape.getText();
                        if (text != null && !text.isBlank()) {
                            builder.append(text).append("\n");
                        }
                    }
                }
                if (builder.length() > 6_000) {
                    break;
                }
            }
            return builder.toString();
        }
    }

    private static byte[] downloadWithLimit(URL url) throws IOException {
        try (InputStream inputStream = unwrapIfGzip(url.openConnection().getInputStream());
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            int total = 0;
            while ((read = inputStream.read(buffer)) != -1) {
                total += read;
                if (total > MAX_DOWNLOAD_BYTES) {
                    break;
                }
                outputStream.write(buffer, 0, read);
            }
            return outputStream.toByteArray();
        }
    }

    private static InputStream unwrapIfGzip(InputStream inputStream) throws IOException {
        PushbackInputStream pushback = new PushbackInputStream(inputStream, 2);
        byte[] signature = new byte[2];
        int length = pushback.read(signature);
        if (length > 0) {
            pushback.unread(signature, 0, length);
        }
        if (length == 2 && (signature[0] & 0xFF) == 0x1F && (signature[1] & 0xFF) == 0x8B) {
            return new GZIPInputStream(pushback);
        }
        return pushback;
    }

    private static List<String> collectSourceUrls(List<Course> courses) {
        return courses.stream()
                .flatMap(course -> (course.getFileUrls() == null ? List.<String>of() : course.getFileUrls()).stream())
                .filter(url -> url != null && !url.isBlank())
                .distinct()
                .limit(20)
                .toList();
    }

    private static String resolveExtension(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        String cleaned = path.toLowerCase(Locale.ROOT);
        int dot = cleaned.lastIndexOf('.');
        if (dot < 0 || dot == cleaned.length() - 1) {
            return "";
        }
        return cleaned.substring(dot + 1);
    }

    private static String nullToDash(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value;
    }

    private static String limit(String value, int maxChars) {
        if (value == null) {
            return "";
        }
        if (value.length() <= maxChars) {
            return value;
        }
        return value.substring(0, maxChars);
    }
}

