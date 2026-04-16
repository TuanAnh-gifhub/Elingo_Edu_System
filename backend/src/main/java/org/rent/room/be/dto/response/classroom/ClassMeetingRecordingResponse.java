package org.rent.room.be.dto.response.classroom;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassMeetingRecordingResponse {

    UUID recordingId;
    UUID classId;
    String roomName;
    String title;
    String recordingUrl;
    String status;
    LocalDateTime startedAt;
    LocalDateTime endedAt;
    Long durationSeconds;
    LocalDateTime createdAt;
}
