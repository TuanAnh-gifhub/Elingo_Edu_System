package org.rent.room.be.dto.response.classroom;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OnlineClassAccessResponse {

    UUID classId;
    String roomName;
    String roomPassword;
    Boolean onlineOpen;
    Boolean teacher;
}

