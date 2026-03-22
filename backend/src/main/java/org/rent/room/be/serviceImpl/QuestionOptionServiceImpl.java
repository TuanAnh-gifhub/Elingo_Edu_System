package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.questionOption.CreateQuestionOptionRequest;
import org.rent.room.be.dto.request.questionOption.UpdateQuestionOptionRequest;
import org.rent.room.be.dto.response.questionOption.QuestionOptionResponse;
import org.rent.room.be.entity.Question;
import org.rent.room.be.entity.QuestionOption;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.QuestionOptionMapper;
import org.rent.room.be.repository.QuestionOptionRepository;
import org.rent.room.be.repository.QuestionRepository;
import org.rent.room.be.service.QuestionOptionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuestionOptionServiceImpl implements QuestionOptionService {

    private final QuestionOptionRepository questionOptionRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionMapper questionOptionMapper;

    @Override
    @Transactional
    public QuestionOptionResponse createOption(CreateQuestionOptionRequest request) {
        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        QuestionOption option = QuestionOption.builder()
                .question(question)
                .optionText(request.getOptionText())
                .isCorrect(request.getIsCorrect() != null ? request.getIsCorrect() : Boolean.FALSE)
                .orderIndex(request.getOrderIndex())
                .build();

        return questionOptionMapper.toResponse(questionOptionRepository.save(option));
    }

    @Override
    public QuestionOptionResponse getOption(UUID optionId) {
        QuestionOption option = questionOptionRepository.findById(optionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_OPTION_NOT_FOUND));
        return questionOptionMapper.toResponse(option);
    }

    @Override
    public PageResponse<QuestionOptionResponse> getOptions(UUID questionId, int page, int size) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<QuestionOption> pageData;
        if (questionId != null) {
            pageData = questionOptionRepository.findByQuestion_QuestionId(questionId, pageable);
        } else {
            pageData = questionOptionRepository.findAll(pageable);
        }

        Page<QuestionOptionResponse> responsePage = pageData.map(questionOptionMapper::toResponse);

        return PageResponse.<QuestionOptionResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(responsePage.getContent())
                .build();
    }

    @Override
    @Transactional
    public QuestionOptionResponse updateOption(UUID optionId, UpdateQuestionOptionRequest request) {
        QuestionOption option = questionOptionRepository.findById(optionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_OPTION_NOT_FOUND));

        if (request.getOptionText() != null) {
            option.setOptionText(request.getOptionText());
        }
        if (request.getIsCorrect() != null) {
            option.setIsCorrect(request.getIsCorrect());
        }
        if (request.getOrderIndex() != null) {
            option.setOrderIndex(request.getOrderIndex());
        }

        return questionOptionMapper.toResponse(questionOptionRepository.save(option));
    }

    @Override
    @Transactional
    public void deleteOption(UUID optionId) {
        QuestionOption option = questionOptionRepository.findById(optionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_OPTION_NOT_FOUND));
        questionOptionRepository.delete(option);
    }
}

