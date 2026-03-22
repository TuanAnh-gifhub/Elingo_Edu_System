package org.rent.room.be.dto.request.quiz;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateQuizRequest {
    String title;
    String description;
    Integer maxAttempts;
}
