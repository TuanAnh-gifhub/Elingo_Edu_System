package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.enrollment.EnrollmentResponse;
import org.rent.room.be.entity.Enrollment;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EnrollmentMapper {

    @Mapping(target = "studentId", source = "student.userId")
    @Mapping(target = "studentName", source = "student.userName")
    @Mapping(target = "classId", source = "enrolledClass.classId")
    @Mapping(target = "className", source = "enrolledClass.className")
    EnrollmentResponse toResponse(Enrollment enrollment);

    List<EnrollmentResponse> toResponseList(List<Enrollment> enrollments);
}
