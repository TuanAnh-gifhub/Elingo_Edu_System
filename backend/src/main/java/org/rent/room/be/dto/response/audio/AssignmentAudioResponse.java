package org.rent.room.be.dto.response.audio;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentAudioResponse {

    UUID audioFileId;
    String audioUrl;
    String transcriptText;
    String mimeType;
    Double durationSeconds;
    Long fileSizeBytes;
}

