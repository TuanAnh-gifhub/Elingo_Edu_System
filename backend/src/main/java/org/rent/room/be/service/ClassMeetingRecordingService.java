package org.rent.room.be.service;

import org.rent.room.be.dto.response.classroom.ClassMeetingRecordingResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ClassMeetingRecordingService {

    List<ClassMeetingRecordingResponse> getRecordingsForStudent(UUID classId, UUID currentUserId);

    List<ClassMeetingRecordingResponse> getRecordingsForTeacher(UUID classId, UUID currentTeacherId);

    void handleJaasWebhook(Map<String, Object> payload);
}
