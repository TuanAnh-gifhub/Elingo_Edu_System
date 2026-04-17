package org.rent.room.be.dto.response.teacher;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherProfileResponse {
    UUID teacherId;
    String teacherName;
    String avatar;
    double averageRating;
    long totalReviews;
    List<String> certificateFiles;
    String bio;
    String expertise;
    String experience;
}

