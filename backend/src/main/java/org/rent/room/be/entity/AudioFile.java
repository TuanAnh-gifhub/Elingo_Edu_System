package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "audio_files", indexes = {
        @Index(name = "idx_audio_uploaded_by", columnList = "uploaded_by"),
        @Index(name = "idx_audio_public_id", columnList = "public_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AudioFile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "audio_file_id")
    UUID audioFileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    User uploadedBy;

    @Column(name = "audio_url", nullable = false, length = 2048)
    String audioUrl;

    @Column(name = "public_id", length = 255)
    String publicId;

    @Column(name = "resource_type", length = 50)
    String resourceType;

    @Column(name = "mime_type", length = 120)
    String mimeType;

    @Column(name = "duration_seconds")
    Double durationSeconds;

    @Column(name = "file_size_bytes")
    Long fileSizeBytes;

    @Column(name = "transcript_text", columnDefinition = "TEXT")
    String transcriptText;
}

