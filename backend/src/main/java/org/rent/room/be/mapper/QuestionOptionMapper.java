package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.questionOption.QuestionOptionResponse;
import org.rent.room.be.entity.QuestionOption;

import java.util.List;

@Mapper(componentModel = "spring")
public interface QuestionOptionMapper {

    @Mapping(target = "questionId", source = "question.questionId")
    QuestionOptionResponse toResponse(QuestionOption option);

    List<QuestionOptionResponse> toResponseList(List<QuestionOption> options);
}

