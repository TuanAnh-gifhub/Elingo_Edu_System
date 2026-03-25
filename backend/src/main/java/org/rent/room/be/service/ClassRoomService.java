package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.classroom.CreateClassRoomRequest;
import org.rent.room.be.dto.request.classroom.UpdateClassRoomRequest;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;

import java.util.List;
import java.util.UUID;

public interface ClassRoomService {

    ClassRoomResponse createClass(CreateClassRoomRequest request);

    ClassRoomResponse getById(UUID classId);

    PageResponse<ClassRoomResponse> getClasses(int page, int size, String keyword, UUID teacherId, Boolean active);

    ClassRoomResponse updateClass(UUID classId, UpdateClassRoomRequest request);

    void softDeleteClass(UUID classId);

    void joinClass(UUID classId, String joinCode);

    List<UUID> getJoinedClassIds();
}

