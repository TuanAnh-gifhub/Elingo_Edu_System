package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.quiz.QuizResponse;
import org.rent.room.be.entity.Quiz;

import java.util.List;

@Mapper(componentModel = "spring")
public interface QuizMapper {

    @Mapping(target = "courseId", source = "course.courseId")
    QuizResponse toResponse(Quiz quiz);

    List<QuizResponse> toResponseList(List<Quiz> quizzes);
}
