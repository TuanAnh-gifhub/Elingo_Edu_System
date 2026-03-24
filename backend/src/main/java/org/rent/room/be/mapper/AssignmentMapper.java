package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.assignment.AssignmentQuestionResponse;
import org.rent.room.be.dto.response.assignment.AssignmentResponse;
import org.rent.room.be.entity.Assignment;
import org.rent.room.be.entity.AssignmentQuestion;

@Mapper(componentModel = "spring")
public interface AssignmentMapper {

    @Mapping(target = "classId", source = "classRoom.classId")
    @Mapping(target = "teacherId", source = "teacher.userId")
    @Mapping(target = "teacherName", source = "teacher.userName")
    AssignmentResponse toResponse(Assignment assignment);

    AssignmentQuestionResponse toQuestionResponse(AssignmentQuestion question);
}

