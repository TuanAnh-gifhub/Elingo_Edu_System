package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.question.QuestionResponse;
import org.rent.room.be.entity.Question;

import java.util.List;

@Mapper(componentModel = "spring", uses = QuestionOptionMapper.class)
public interface QuestionMapper {

    @Mapping(target = "quizId", source = "quiz.quizId")
    @Mapping(target = "options", source = "options")
    QuestionResponse toResponse(Question question);

    List<QuestionResponse> toResponseList(List<Question> questions);
}

