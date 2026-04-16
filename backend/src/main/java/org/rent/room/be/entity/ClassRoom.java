package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassRoom extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "class_id")
    UUID classId;

    @Column(name = "class_name", nullable = false, length = 200)
    String className;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    User teacher;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    BigDecimal price;

    @Column(name = "start_date")
    LocalDateTime startDate;

    @Column(name = "end_date")
    LocalDateTime endDate;

    @Column(name = "max_students")
    Integer maxStudents;

    @Column(name = "current_students")
    Integer currentStudents;

    @Column(name = "is_active")
    boolean active;

    @Column(name = "schedule", length = 500)
    String schedule;

    // Thêm trường poster dạng URL ảnh cho lớp học
    @Column(name = "poster", length = 1000)
    String poster;

    @Column(name = "online_open")
    Boolean onlineOpen;

    @Column(name = "online_room_code", length = 64)
    String onlineRoomCode;

    @Column(name = "online_room_password", length = 64)
    String onlineRoomPassword;

    @OneToMany(mappedBy = "classRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Course> courses;
}