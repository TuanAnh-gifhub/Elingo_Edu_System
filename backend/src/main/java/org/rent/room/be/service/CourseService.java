package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.course.CreateCourseRequest;
import org.rent.room.be.dto.request.course.UpdateCourseRequest;
import org.rent.room.be.dto.response.course.CourseResponse;

import java.util.UUID;

public interface CourseService {

    CourseResponse createCourse(CreateCourseRequest request);

    CourseResponse getCourse(UUID courseId);

    PageResponse<CourseResponse> getCourses(UUID classId, int page, int size);

    CourseResponse updateCourse(UUID courseId, UpdateCourseRequest request);

    void deleteCourse(UUID courseId);

    org.springframework.core.io.Resource downloadFile(UUID courseId, String fileUrl);
}

