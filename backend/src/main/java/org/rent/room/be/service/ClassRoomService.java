package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.classroom.CreateClassRoomRequest;
import org.rent.room.be.dto.request.classroom.UpdateClassRoomRequest;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;

import java.math.BigDecimal;
import java.util.UUID;

public interface ClassRoomService {

    ClassRoomResponse createClass(CreateClassRoomRequest request);

    ClassRoomResponse getById(UUID classId);

    PageResponse<ClassRoomResponse> getClasses(
            int page,
            int size,
            String keyword,
            UUID teacherId,
            Boolean active,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String studyDay,
            String studyHour
    );

    ClassRoomResponse updateClass(UUID classId, UpdateClassRoomRequest request);

    void softDeleteClass(UUID classId);
}

