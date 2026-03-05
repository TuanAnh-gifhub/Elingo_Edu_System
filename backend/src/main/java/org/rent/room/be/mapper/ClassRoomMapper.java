package org.rent.room.be.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;
import org.rent.room.be.entity.ClassRoom;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ClassRoomMapper {

    @Mapping(target = "teacherId", source = "teacher.userId")
    @Mapping(target = "teacherName", source = "teacher.userName")
    @Mapping(target = "teacherEmail", source = "teacher.email")
    ClassRoomResponse toResponse(ClassRoom classRoom);

    List<ClassRoomResponse> toResponseList(List<ClassRoom> classRooms);
}

