package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "assignments", indexes = {
        @Index(name = "idx_assignment_class", columnList = "class_id"),
        @Index(name = "idx_assignment_teacher", columnList = "teacher_id"),
        @Index(name = "idx_assignment_deadline", columnList = "deadline")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Assignment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "assignment_id")
    UUID assignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    ClassRoom classRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    User teacher;

    @Column(name = "title", nullable = false, length = 255)
    String title;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "deadline")
    LocalDateTime deadline;

    @Column(name = "access_password_hash", length = 255)
    String accessPasswordHash;

    @Column(name = "max_attempts", nullable = false)
    Integer maxAttempts;

    @Column(name = "time_limit_minutes")
    Integer timeLimitMinutes;

    @Column(name = "is_active", nullable = false)
    boolean active;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    List<AssignmentQuestion> questions;
}

