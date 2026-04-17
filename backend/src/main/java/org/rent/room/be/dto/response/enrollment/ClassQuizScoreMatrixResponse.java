package org.rent.room.be.dto.response.enrollment;

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
public class ClassQuizScoreMatrixResponse {

    UUID classId;
    List<QuizScoreColumnResponse> columns;
    List<StudentQuizScoreRowResponse> rows;
}

