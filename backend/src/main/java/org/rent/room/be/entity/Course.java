package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Course extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "course_id")
    UUID courseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    ClassRoom classRoom;

    @Column(name = "title", nullable = false, length = 255)
    String title;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "order_index")
    Integer orderIndex;

    /**
     * Danh sách file tài liệu của course: có thể là URL trỏ tới file Word/PDF/PPT
     * đã upload lên storage (VD: S3, Cloudinary, local, ...).
     */
    @ElementCollection
    @CollectionTable(
            name = "course_files",
            joinColumns = @JoinColumn(name = "course_id")
    )
    @Column(name = "file_url", nullable = false, length = 2048)
    List<String> fileUrls;
}

