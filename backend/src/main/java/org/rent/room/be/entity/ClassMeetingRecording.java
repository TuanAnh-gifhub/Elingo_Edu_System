package org.rent.room.be.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.rent.room.be.base.BaseEntity;

import java.time.LocalDateTime;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "class_meeting_recordings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassMeetingRecording extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "recording_id")
    UUID recordingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    ClassRoom classRoom;

    @Column(name = "room_name", length = 255, nullable = false)
    String roomName;

    @Column(name = "title", length = 255)
    String title;

    @Column(name = "recording_url", length = 2000)
    String recordingUrl;

    @Column(name = "provider", length = 50, nullable = false)
    String provider;

    @Column(name = "status", length = 30, nullable = false)
    String status;

    @Column(name = "started_at")
    LocalDateTime startedAt;

    @Column(name = "ended_at")
    LocalDateTime endedAt;

    @Column(name = "duration_seconds")
    Long durationSeconds;

    @Column(name = "source_event_id", length = 255, unique = true)
    String sourceEventId;

    @Column(name = "metadata", columnDefinition = "TEXT")
    String metadata;
}
