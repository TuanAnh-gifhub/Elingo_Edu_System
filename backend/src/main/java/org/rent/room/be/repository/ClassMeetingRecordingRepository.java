package org.rent.room.be.repository;

import org.rent.room.be.entity.ClassMeetingRecording;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassMeetingRecordingRepository extends JpaRepository<ClassMeetingRecording, UUID> {

    List<ClassMeetingRecording> findByClassRoom_ClassIdOrderByCreatedAtDesc(UUID classId);

    List<ClassMeetingRecording> findByClassRoom_ClassIdAndStatusOrderByCreatedAtDesc(UUID classId, String status);

    Optional<ClassMeetingRecording> findBySourceEventId(String sourceEventId);

    Optional<ClassMeetingRecording> findFirstByClassRoom_ClassIdAndRoomNameAndProviderOrderByCreatedAtDesc(
            UUID classId,
            String roomName,
            String provider
    );

    void deleteByClassRoom_ClassId(UUID classId);
}


