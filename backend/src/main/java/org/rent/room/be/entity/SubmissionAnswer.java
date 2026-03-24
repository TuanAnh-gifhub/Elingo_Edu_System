package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.math.BigDecimal;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "submission_answers", indexes = {
        @Index(name = "idx_submission_answer_submission", columnList = "submission_id"),
        @Index(name = "idx_submission_answer_question", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionAnswer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "answer_id")
    UUID answerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    AssignmentQuestion question;

    @Column(name = "answer_text", columnDefinition = "TEXT")
    String answerText;

    @Column(name = "selected_option_index")
    Integer selectedOptionIndex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audio_file_id")
    AudioFile audioFile;

    @Column(name = "audio_url", length = 2048)
    String audioUrl;

    @Column(name = "transcript_text", columnDefinition = "TEXT")
    String transcriptText;

    @Column(name = "score", precision = 6, scale = 2)
    BigDecimal score;

    @Column(name = "feedback", columnDefinition = "TEXT")
    String feedback;

    @Column(name = "is_auto_graded")
    boolean autoGraded;
}

