package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.SubmissionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "submissions", indexes = {
        @Index(name = "idx_submission_assignment", columnList = "assignment_id"),
        @Index(name = "idx_submission_student", columnList = "student_id"),
        @Index(name = "idx_submission_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Submission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "submission_id")
    UUID submissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    User student;

    @Column(name = "submitted_at", nullable = false)
    LocalDateTime submittedAt;

    @Column(name = "attempt_number", nullable = false)
    Integer attemptNumber;

    @Column(name = "attempt_started_at")
    LocalDateTime attemptStartedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    SubmissionStatus status;

    @Column(name = "total_score", precision = 8, scale = 2)
    BigDecimal totalScore;

    @Column(name = "teacher_feedback", columnDefinition = "TEXT")
    String teacherFeedback;

    @Column(name = "is_auto_submitted", nullable = false)
    boolean autoSubmitted;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    List<SubmissionAnswer> answers;
}

