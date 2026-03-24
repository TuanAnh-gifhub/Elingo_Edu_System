package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;
import org.rent.room.be.constant.AssignmentQuestionType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "assignment_questions", indexes = {
        @Index(name = "idx_assignment_question_assignment", columnList = "assignment_id"),
        @Index(name = "idx_assignment_question_type", columnList = "question_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "question_id")
    UUID questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    Assignment assignment;

    @Column(name = "question_order", nullable = false)
    Integer questionOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 50)
    AssignmentQuestionType questionType;

    @Column(name = "question_content", nullable = false, columnDefinition = "TEXT")
    String questionContent;

    @ElementCollection
    @CollectionTable(name = "assignment_question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_value", length = 1000)
    List<String> options;

    @Column(name = "correct_option_index")
    Integer correctOptionIndex;

    @Column(name = "sample_answer", columnDefinition = "TEXT")
    String sampleAnswer;

    @Column(name = "max_score", nullable = false, precision = 6, scale = 2)
    BigDecimal maxScore;
}

