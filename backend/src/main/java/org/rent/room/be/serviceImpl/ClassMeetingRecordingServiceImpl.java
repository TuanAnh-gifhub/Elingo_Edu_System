package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.SubscriptionStatus;
import org.rent.room.be.dto.response.classroom.ClassMeetingRecordingResponse;
import org.rent.room.be.entity.ClassMeetingRecording;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.UserSubscription;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.repository.ClassMeetingRecordingRepository;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.repository.UserSubscriptionRepository;
import org.rent.room.be.service.ClassMeetingRecordingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ClassMeetingRecordingServiceImpl implements ClassMeetingRecordingService {

    private static final String READY_STATUS = "READY";
    private static final String PROCESSING_STATUS = "PROCESSING";
    private static final String FAILED_STATUS = "FAILED";
    private static final String JAAS_PROVIDER = "JAAS";
    private static final Pattern CLASS_ID_PATTERN = Pattern.compile("class-([0-9a-fA-F-]{36})");

    private final ClassMeetingRecordingRepository classMeetingRecordingRepository;
    private final ClassRoomRepository classRoomRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ClassMeetingRecordingResponse> getRecordingsForStudent(UUID classId, UUID currentUserId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        boolean isEnrolled = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(currentUserId, classId);
        if (!isEnrolled) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!hasActiveSubscription(user)) {
            throw new AppException(ErrorCode.RECORDING_SUBSCRIPTION_REQUIRED);
        }

        List<ClassMeetingRecording> records = classMeetingRecordingRepository
                .findByClassRoom_ClassIdOrderByCreatedAtDesc(classId);
        return mapToResponse(records, classRoom.getClassId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassMeetingRecordingResponse> getRecordingsForTeacher(UUID classId, UUID currentTeacherId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (classRoom.getTeacher() == null || !classRoom.getTeacher().getUserId().equals(currentTeacherId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<ClassMeetingRecording> records = classMeetingRecordingRepository
                .findByClassRoom_ClassIdOrderByCreatedAtDesc(classId);
        return mapToResponse(records, classRoom.getClassId());
    }

    @Override
    @Transactional
    public void handleJaasWebhook(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return;
        }

        Map<String, Object> data = unwrapPayload(payload);
        if (data.isEmpty()) {
            return;
        }

        String eventType = extractFirstString(data, "eventType", "event_type", "type", "name");
        if (!isSupportedRecordingEvent(eventType, data)) {
            return;
        }

        String sourceEventId = extractFirstString(data,
                "eventId", "event_id", "id", "recordingId", "recording_id");

        String roomName = extractFirstString(data,
                "roomName", "room_name", "conferenceName", "conference_name");
        if (roomName == null || roomName.isBlank()) {
            return;
        }

        Optional<UUID> classIdOpt = extractClassIdFromRoomName(roomName);
        if (classIdOpt.isEmpty()) {
            return;
        }

        ClassRoom classRoom = classRoomRepository.findById(classIdOpt.get()).orElse(null);
        if (classRoom == null) {
            return;
        }

        Optional<ClassMeetingRecording> existingRecording = Optional.empty();
        if (sourceEventId != null && !sourceEventId.isBlank()) {
            existingRecording = classMeetingRecordingRepository.findBySourceEventId(sourceEventId);
        }
        if (existingRecording.isEmpty()) {
            existingRecording = classMeetingRecordingRepository
                    .findFirstByClassRoom_ClassIdAndRoomNameAndProviderOrderByCreatedAtDesc(
                            classRoom.getClassId(),
                            roomName,
                            JAAS_PROVIDER
                    );
        }

        String recordingUrl = extractFirstString(data,
                "recordingUrl", "recording_url", "downloadUrl", "download_url", "url", "fileUrl", "file_url");

        String title = extractFirstString(data, "title", "name", "recordingName", "recording_name");
        if ((title == null || title.isBlank()) && existingRecording.isPresent()) {
            title = existingRecording.get().getTitle();
        }
        if (title == null || title.isBlank()) {
            title = "Bản ghi lớp " + classRoom.getClassName();
        }

        LocalDateTime startedAt = parseDateTime(extractFirstString(data,
                "startedAt", "started_at", "startTime", "start_time"));
        if (startedAt == null && existingRecording.isPresent()) {
            startedAt = existingRecording.get().getStartedAt();
        }

        LocalDateTime endedAt = parseDateTime(extractFirstString(data,
                "endedAt", "ended_at", "endTime", "end_time"));
        if (endedAt == null && existingRecording.isPresent()) {
            endedAt = existingRecording.get().getEndedAt();
        }

        Long durationSeconds = parseLong(extractFirstString(data,
                "durationSeconds", "duration_seconds", "duration"));
        if (durationSeconds == null && existingRecording.isPresent()) {
            durationSeconds = existingRecording.get().getDurationSeconds();
        }

        if ((recordingUrl == null || recordingUrl.isBlank()) && existingRecording.isPresent()) {
            recordingUrl = existingRecording.get().getRecordingUrl();
        }

        String statusHint = extractFirstString(data,
                "status", "recordingStatus", "recording_status", "state");
        String status = normalizeStatus(statusHint, recordingUrl, existingRecording.orElse(null));

        // Keep stronger terminal states when provider sends out-of-order updates.
        if (existingRecording.isPresent()
                && READY_STATUS.equals(existingRecording.get().getStatus())
                && PROCESSING_STATUS.equals(status)
                && (recordingUrl == null || recordingUrl.isBlank())) {
            status = READY_STATUS;
        }

        ClassMeetingRecording recording = existingRecording.orElseGet(ClassMeetingRecording::new);
        recording.setClassRoom(classRoom);
        recording.setRoomName(roomName);
        recording.setTitle(title);
        recording.setRecordingUrl(recordingUrl);
        recording.setProvider(JAAS_PROVIDER);
        recording.setStatus(status);
        recording.setStartedAt(startedAt);
        recording.setEndedAt(endedAt);
        recording.setDurationSeconds(durationSeconds);
        if (sourceEventId != null && !sourceEventId.isBlank()) {
            recording.setSourceEventId(sourceEventId);
        }
        recording.setMetadata(String.valueOf(data));

        classMeetingRecordingRepository.save(recording);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> unwrapPayload(Map<String, Object> payload) {
        Object data = payload.get("data");
        if (data instanceof Map<?, ?> nested) {
            return (Map<String, Object>) nested;
        }

        Object event = payload.get("event");
        if (event instanceof Map<?, ?> nested) {
            return (Map<String, Object>) nested;
        }

        Object wrappedPayload = payload.get("payload");
        if (wrappedPayload instanceof Map<?, ?> nested) {
            return (Map<String, Object>) nested;
        }

        return payload;
    }

    private boolean isSupportedRecordingEvent(String eventType, Map<String, Object> payload) {
        if (eventType != null && !eventType.isBlank()) {
            String normalized = eventType.toLowerCase(Locale.ROOT);
            return normalized.contains("record")
                    || normalized.contains("transcrib")
                    || normalized.contains("file");
        }

        String statusHint = extractFirstString(payload,
                "status", "recordingStatus", "recording_status", "state");
        String recordingUrl = extractFirstString(payload,
                "recordingUrl", "recording_url", "downloadUrl", "download_url", "url", "fileUrl", "file_url");
        return (statusHint != null && !statusHint.isBlank())
                || (recordingUrl != null && !recordingUrl.isBlank());
    }

    private String normalizeStatus(String statusHint, String recordingUrl, ClassMeetingRecording existingRecording) {
        if (statusHint != null && !statusHint.isBlank()) {
            String normalizedHint = statusHint.trim().toUpperCase(Locale.ROOT);

            if (normalizedHint.contains("READY")
                    || normalizedHint.contains("COMPLETE")
                    || normalizedHint.contains("AVAILABLE")
                    || normalizedHint.contains("DONE")) {
                return READY_STATUS;
            }

            if (normalizedHint.contains("FAILED")
                    || normalizedHint.contains("ERROR")) {
                return FAILED_STATUS;
            }

            if (normalizedHint.contains("PROCESS")
                    || normalizedHint.contains("PENDING")
                    || normalizedHint.contains("START")) {
                return PROCESSING_STATUS;
            }
        }

        if (recordingUrl != null && !recordingUrl.isBlank()) {
            return READY_STATUS;
        }

        if (existingRecording != null && existingRecording.getStatus() != null && !existingRecording.getStatus().isBlank()) {
            return existingRecording.getStatus();
        }

        return PROCESSING_STATUS;
    }

    private List<ClassMeetingRecordingResponse> mapToResponse(List<ClassMeetingRecording> records, UUID classId) {
        List<ClassMeetingRecordingResponse> responseList = new ArrayList<>();
        for (ClassMeetingRecording recording : records) {
            responseList.add(ClassMeetingRecordingResponse.builder()
                    .recordingId(recording.getRecordingId())
                    .classId(classId)
                    .roomName(recording.getRoomName())
                    .title(recording.getTitle())
                    .recordingUrl(recording.getRecordingUrl())
                    .status(recording.getStatus())
                    .startedAt(recording.getStartedAt())
                    .endedAt(recording.getEndedAt())
                    .durationSeconds(recording.getDurationSeconds())
                    .createdAt(recording.getCreatedAt())
                    .build());
        }
        return responseList;
    }

    private boolean hasActiveSubscription(User user) {
        Optional<UserSubscription> activeSubscription = userSubscriptionRepository
                .findFirstByUserAndStatusOrderByEndDateDesc(user, SubscriptionStatus.ACTIVE);

        if (activeSubscription.isEmpty()) {
            return false;
        }

        UserSubscription subscription = activeSubscription.get();
        return subscription.getEndDate() != null && !subscription.getEndDate().isBefore(LocalDateTime.now());
    }

    @SuppressWarnings("unchecked")
    private String extractFirstString(Map<String, Object> source, String... keys) {
        for (String key : keys) {
            Object value = source.get(key);
            if (value instanceof String s && !s.isBlank()) {
                return s;
            }
        }

        for (Object value : source.values()) {
            if (value instanceof Map<?, ?> nestedMap) {
                String nested = extractFirstString((Map<String, Object>) nestedMap, keys);
                if (nested != null && !nested.isBlank()) {
                    return nested;
                }
            }
        }

        return null;
    }

    private Optional<UUID> extractClassIdFromRoomName(String roomName) {
        Matcher matcher = CLASS_ID_PATTERN.matcher(roomName);
        if (!matcher.find()) {
            return Optional.empty();
        }

        try {
            return Optional.of(UUID.fromString(matcher.group(1)));
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
    }

    private LocalDateTime parseDateTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        try {
            return LocalDateTime.parse(raw);
        } catch (DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(raw).toLocalDateTime();
            } catch (DateTimeParseException ignoredAgain) {
                return null;
            }
        }
    }

    private Long parseLong(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}



