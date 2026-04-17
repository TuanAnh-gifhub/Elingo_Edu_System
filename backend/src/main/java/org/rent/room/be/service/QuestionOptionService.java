package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.questionOption.CreateQuestionOptionRequest;
import org.rent.room.be.dto.request.questionOption.UpdateQuestionOptionRequest;
import org.rent.room.be.dto.response.questionOption.QuestionOptionResponse;

import java.util.UUID;

public interface QuestionOptionService {
    QuestionOptionResponse createOption(CreateQuestionOptionRequest request);

    QuestionOptionResponse getOption(UUID optionId);

    PageResponse<QuestionOptionResponse> getOptions(UUID questionId, int page, int size);

    QuestionOptionResponse updateOption(UUID optionId, UpdateQuestionOptionRequest request);

    void deleteOption(UUID optionId);
}

