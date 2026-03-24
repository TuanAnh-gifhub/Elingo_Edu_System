package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.submission.SubmissionAnswerResponse;
import org.rent.room.be.dto.response.submission.SubmissionResponse;
import org.rent.room.be.entity.Submission;
import org.rent.room.be.entity.SubmissionAnswer;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {

    @Mapping(target = "assignmentId", source = "assignment.assignmentId")
    @Mapping(target = "studentId", source = "student.userId")
    @Mapping(target = "studentName", source = "student.userName")
    SubmissionResponse toResponse(Submission submission);

    @Mapping(target = "questionId", source = "question.questionId")
    @Mapping(target = "questionOrder", source = "question.questionOrder")
    @Mapping(target = "questionType", source = "question.questionType")
    @Mapping(target = "questionContent", source = "question.questionContent")
    SubmissionAnswerResponse toAnswerResponse(SubmissionAnswer answer);
}

