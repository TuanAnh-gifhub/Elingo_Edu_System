package org.rent.room.be;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Enrollment;
import org.rent.room.be.entity.Role;
import org.rent.room.be.entity.User;
import org.rent.room.be.repository.*;
import org.rent.room.be.service.SpeechToTextService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class AssignmentSubmissionFlowIntegrationTest {

    @MockitoBean
    private JavaMailSender javaMailSender;

    @MockitoBean
    private SpeechToTextService speechToTextService;

    @MockitoBean
    private org.rent.room.be.repository.mongo.PasswordResetTokenRepository passwordResetTokenRepository;

    @MockitoBean
    private org.rent.room.be.repository.mongo.RefreshTokenRepository refreshTokenRepository;

    @MockitoBean
    private org.rent.room.be.repository.mongo.TemporaryRegistrationRepository temporaryRegistrationRepository;

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClassRoomRepository classRoomRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UUID classId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        Role teacherRole = roleRepository.findByRoleName("TEACHER")
                .orElseGet(() -> roleRepository.save(Role.builder().roleName("TEACHER").active(true).build()));
        Role studentRole = roleRepository.findByRoleName("STUDENT")
                .orElseGet(() -> roleRepository.save(Role.builder().roleName("STUDENT").active(true).build()));

        User teacher = userRepository.findByEmail("teacher-it@test.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .userName("Teacher IT")
                        .email("teacher-it@test.com")
                        .passwordHash(passwordEncoder.encode("12345678"))
                        .dateOfBirth(LocalDate.of(1990, 1, 1))
                        .role(teacherRole)
                        .active(true)
                        .build()));

        User student = userRepository.findByEmail("student-it@test.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .userName("Student IT")
                        .email("student-it@test.com")
                        .passwordHash(passwordEncoder.encode("12345678"))
                        .dateOfBirth(LocalDate.of(2000, 1, 1))
                        .role(studentRole)
                        .active(true)
                        .build()));

        userRepository.findByEmail("outsider-it@test.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .userName("Outsider IT")
                        .email("outsider-it@test.com")
                        .passwordHash(passwordEncoder.encode("12345678"))
                        .dateOfBirth(LocalDate.of(2001, 1, 1))
                        .role(studentRole)
                        .active(true)
                        .build()));

        ClassRoom classRoom = classRoomRepository.save(ClassRoom.builder()
                .className("IT Class")
                .description("Integration test class")
                .teacher(teacher)
                .price(new BigDecimal("100000"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .maxStudents(20)
                .currentStudents(1)
                .active(true)
                .schedule("Mon-Wed")
                .build());

        enrollmentRepository.save(Enrollment.builder()
                .student(student)
                .enrolledClass(classRoom)
                .enrollmentDate(LocalDateTime.now())
                .price(new BigDecimal("100000"))
                .paymentStatus(Enrollment.PaymentStatus.PAID)
                .paymentAmount(new BigDecimal("100000"))
                .paymentDate(LocalDateTime.now())
                .build());

        this.classId = classRoom.getClassId();
    }

    @Test
    void teacherCreateAssignmentStudentSubmitTeacherGrade_flowSuccess() throws Exception {
        String createRequest = """
                {
                  "classId": "%s",
                  "title": "Week 1 Quiz",
                  "description": "Basic MCQ",
                  "deadline": "%s",
                  "questions": [
                    {
                      "questionOrder": 1,
                      "questionType": "MULTIPLE_CHOICE",
                      "questionContent": "2 + 2 = ?",
                      "options": ["3", "4", "5"],
                      "correctOptionIndex": 1,
                      "maxScore": 10
                    }
                  ]
                }
                """.formatted(classId, LocalDateTime.now().plusDays(1));

        MvcResult createResult = mockMvc.perform(post("/assignments")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("teacher-it@test.com").roles("TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.result.title").value("Week 1 Quiz"))
                .andReturn();

        JsonNode createJson = parseResponse(createResult);
        String assignmentId = createJson.path("result").path("assignmentId").asText();
        String questionId = createJson.path("result").path("questions").get(0).path("questionId").asText();

        String submitRequest = """
                {
                  "assignmentId": "%s",
                  "answers": [
                    {
                      "questionId": "%s",
                      "selectedOptionIndex": 1
                    }
                  ]
                }
                """.formatted(assignmentId, questionId);

        MvcResult submitResult = mockMvc.perform(post("/submissions")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("student-it@test.com").roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.result.status").value("GRADED"))
                .andExpect(jsonPath("$.result.totalScore").value(10))
                .andReturn();

        String submissionId = parseResponse(submitResult).path("result").path("submissionId").asText();
        String answerId = parseResponse(submitResult).path("result").path("answers").get(0).path("answerId").asText();

        String gradeRequest = """
                {
                  "teacherFeedback": "Good job",
                  "answers": [
                    {
                      "answerId": "%s",
                      "score": 10,
                      "feedback": "Correct"
                    }
                  ]
                }
                """.formatted(answerId);

        mockMvc.perform(patch("/submissions/{submissionId}/grade", submissionId)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("teacher-it@test.com").roles("TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gradeRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("GRADED"))
                .andExpect(jsonPath("$.result.teacherFeedback").value("Good job"));

        mockMvc.perform(get("/submissions/{submissionId}", submissionId)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("student-it@test.com").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.submissionId").value(submissionId));
    }

    @Test
    void outsiderStudentCannotReadAssignment_forbidden() throws Exception {
        String createRequest = """
                {
                  "classId": "%s",
                  "title": "Restricted Assignment",
                  "questions": [
                    {
                      "questionOrder": 1,
                      "questionType": "TEXT",
                      "questionContent": "Say hello",
                      "maxScore": 5
                    }
                  ]
                }
                """.formatted(classId);

        MvcResult createResult = mockMvc.perform(post("/assignments")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("teacher-it@test.com").roles("TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRequest))
                .andExpect(status().isOk())
                .andReturn();

        String assignmentId = parseResponse(createResult).path("result").path("assignmentId").asText();
        assertThat(assignmentId).isNotBlank();

        mockMvc.perform(get("/assignments/{assignmentId}", assignmentId)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("outsider-it@test.com").roles("STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void nonOwnerTeacherCannotCreateAssignment_forbidden() throws Exception {
        User anotherTeacher = createTeacher("teacher-2-it@test.com", "Teacher 2 IT", LocalDate.of(1992, 2, 2));
        assertThat(anotherTeacher.getUserId()).isNotNull();

        String createRequest = """
                {
                  "classId": "%s",
                  "title": "Cross Owner Create",
                  "questions": [
                    {
                      "questionOrder": 1,
                      "questionType": "TEXT",
                      "questionContent": "Any text",
                      "maxScore": 5
                    }
                  ]
                }
                """.formatted(classId);

        mockMvc.perform(post("/assignments")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("teacher-2-it@test.com").roles("TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRequest))
                .andExpect(status().isForbidden());
    }

    @Test
    void studentOnlySeesAssignmentsOfEnrolledClasses() throws Exception {
        User anotherTeacher = createTeacher("teacher-3-it@test.com", "Teacher 3 IT", LocalDate.of(1991, 3, 3));

        ClassRoom outsiderClass = classRoomRepository.save(ClassRoom.builder()
                .className("Outsider Class")
                .description("Class without enrollment for student-it")
                .teacher(anotherTeacher)
                .price(new BigDecimal("150000"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .maxStudents(20)
                .currentStudents(0)
                .active(true)
                .schedule("Tue-Thu")
                .build());

        String createEnrolledAssignment = """
                {
                  "classId": "%s",
                  "title": "Visible Assignment",
                  "questions": [
                    {
                      "questionOrder": 1,
                      "questionType": "TEXT",
                      "questionContent": "Say hello",
                      "maxScore": 5
                    }
                  ]
                }
                """.formatted(classId);

        String createOutsiderAssignment = """
                {
                  "classId": "%s",
                  "title": "Hidden Assignment",
                  "questions": [
                    {
                      "questionOrder": 1,
                      "questionType": "TEXT",
                      "questionContent": "Say hi",
                      "maxScore": 5
                    }
                  ]
                }
                """.formatted(outsiderClass.getClassId());

        mockMvc.perform(post("/assignments")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("teacher-it@test.com").roles("TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createEnrolledAssignment))
                .andExpect(status().isOk());

        mockMvc.perform(post("/assignments")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("teacher-3-it@test.com").roles("TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createOutsiderAssignment))
                .andExpect(status().isOk());

        mockMvc.perform(get("/assignments")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("student-it@test.com").roles("STUDENT"))
                        .param("page", "1")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalElements").value(1))
                .andExpect(jsonPath("$.result.data", hasSize(1)))
                .andExpect(jsonPath("$.result.data[0].title").value("Visible Assignment"));
    }

    @Test
    void nonOwnerTeacherCannotGradeSubmission_forbidden() throws Exception {
        User anotherTeacher = createTeacher("teacher-4-it@test.com", "Teacher 4 IT", LocalDate.of(1989, 4, 4));
        assertThat(anotherTeacher.getUserId()).isNotNull();

        String createRequest = """
                {
                  "classId": "%s",
                  "title": "Grading Ownership",
                  "questions": [
                    {
                      "questionOrder": 1,
                      "questionType": "MULTIPLE_CHOICE",
                      "questionContent": "3 + 3 = ?",
                      "options": ["5", "6", "7"],
                      "correctOptionIndex": 1,
                      "maxScore": 10
                    }
                  ]
                }
                """.formatted(classId);

        MvcResult createResult = mockMvc.perform(post("/assignments")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("teacher-it@test.com").roles("TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRequest))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode createJson = parseResponse(createResult);
        String assignmentId = createJson.path("result").path("assignmentId").asText();
        String questionId = createJson.path("result").path("questions").get(0).path("questionId").asText();

        String submitRequest = """
                {
                  "assignmentId": "%s",
                  "answers": [
                    {
                      "questionId": "%s",
                      "selectedOptionIndex": 1
                    }
                  ]
                }
                """.formatted(assignmentId, questionId);

        MvcResult submitResult = mockMvc.perform(post("/submissions")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("student-it@test.com").roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitRequest))
                .andExpect(status().isOk())
                .andReturn();

        String submissionId = parseResponse(submitResult).path("result").path("submissionId").asText();
        String answerId = parseResponse(submitResult).path("result").path("answers").get(0).path("answerId").asText();

        String gradeRequest = """
                {
                  "teacherFeedback": "Should fail",
                  "answers": [
                    {
                      "answerId": "%s",
                      "score": 10,
                      "feedback": "Correct"
                    }
                  ]
                }
                """.formatted(answerId);

        mockMvc.perform(patch("/submissions/{submissionId}/grade", submissionId)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("teacher-4-it@test.com").roles("TEACHER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(gradeRequest))
                .andExpect(status().isForbidden());
    }

    private User createTeacher(String email, String userName, LocalDate dateOfBirth) {
        Role teacherRole = roleRepository.findByRoleName("TEACHER")
                .orElseGet(() -> roleRepository.save(Role.builder().roleName("TEACHER").active(true).build()));

        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(User.builder()
                        .userName(userName)
                        .email(email)
                        .passwordHash(passwordEncoder.encode("12345678"))
                        .dateOfBirth(dateOfBirth)
                        .role(teacherRole)
                        .active(true)
                        .build()));
    }

    private JsonNode parseResponse(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }
}










