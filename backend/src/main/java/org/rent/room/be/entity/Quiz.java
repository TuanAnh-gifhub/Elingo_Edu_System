package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.ColumnDefault;
import org.rent.room.be.base.BaseEntity;

import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Quiz extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "quiz_id")
    UUID quizId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    Course course;

    @Column(name = "title", nullable = false, length = 255)
    String title;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    /** Số lần tối đa học sinh được làm bài (do giáo viên quy định). null hoặc nhỏ hơn 1 được coi là 1. */
    @Column(name = "max_attempts")
    Integer maxAttempts;

    /** Thời gian làm bài (phút). */
    @Column(name = "duration_minutes")
    Integer durationMinutes;

    /** Trạng thái mở bài quiz cho học sinh. Mặc định khóa khi tạo mới. */
    @Builder.Default
    @ColumnDefault("false")
    @Column(name = "is_open", nullable = false)
    Boolean isOpen = false;

    @OneToMany(
            mappedBy = "quiz",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    List<Question> questions;
}
