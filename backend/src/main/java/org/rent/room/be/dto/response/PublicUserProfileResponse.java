package org.rent.room.be.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PublicUserProfileResponse {
    UUID userId;
    String userName;
    String role;
    String gender;
    LocalDateTime joinedAt;
    String bio;
    String expertise;
    String experience;
    int certificateCount;
}
