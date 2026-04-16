package org.rent.room.be.dto.request.classroom;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateClassOnlineStatusRequest {

    @NotNull
    Boolean onlineOpen;
}

