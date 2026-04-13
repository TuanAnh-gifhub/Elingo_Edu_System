package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.response.UserResponse;
import org.rent.room.be.dto.response.teacher.TeacherProfileResponse;

import java.util.List;
import java.util.UUID;

public interface TeacherService {

	List<TeacherProfileResponse> getTopTeachers(int limit);

	PageResponse<UserResponse> getTeachers(int page, int size, Boolean active, String keyword);

	void updateTeacherStatus(UUID teacherId, Boolean active);
}

