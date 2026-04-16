package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.classroom.CreateClassRoomRequest;
import org.rent.room.be.dto.request.classroom.UpdateClassRoomRequest;
import org.rent.room.be.dto.response.classroom.ClassLiveStatusEventResponse;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;
import org.rent.room.be.dto.response.classroom.OnlineClassAccessResponse;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.ClassRoomMapper;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.ClassRoomService;
import org.rent.room.be.specification.ClassRoomSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassRoomServiceImpl implements ClassRoomService {

    private final ClassRoomRepository classRoomRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassRoomMapper classRoomMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String ROOM_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    @Override
    @Transactional
    public ClassRoomResponse createClass(CreateClassRoomRequest request, UUID currentTeacherId) {
        User teacher = userRepository.findById(currentTeacherId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        ClassRoom classRoom = ClassRoom.builder()
                .className(request.getClassName())
                .description(request.getDescription())
                .teacher(teacher)
                .price(request.getPrice())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .maxStudents(request.getMaxStudents())
                .currentStudents(0)
                .active(true)
                .schedule(request.getSchedule())
                .poster(request.getPoster())
                .onlineOpen(false)
                .build();

        return classRoomMapper.toResponse(classRoomRepository.save(classRoom));
    }

    @Override
    public ClassRoomResponse getById(UUID classId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        return classRoomMapper.toResponse(classRoom);
    }

    @Override
    public PageResponse<ClassRoomResponse> getClasses(
            int page,
            int size,
            String keyword,
            UUID teacherId,
            Boolean active,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String studyDay,
            String studyHour
    ) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<ClassRoom> spec = ClassRoomSpecification.filterClasses(
                keyword,
                teacherId,
                active,
                minPrice,
                maxPrice,
                studyDay,
                studyHour
        );

        Page<ClassRoom> pageData = classRoomRepository.findAll(spec, pageable);

        return PageResponse.<ClassRoomResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(pageData.map(classRoomMapper::toResponse).getContent())
                .build();
    }

    @Override
    @Transactional
    public ClassRoomResponse updateClass(UUID classId, UpdateClassRoomRequest request, UUID currentTeacherId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (classRoom.getTeacher() == null || !classRoom.getTeacher().getUserId().equals(currentTeacherId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (request.getClassName() != null) {
            classRoom.setClassName(request.getClassName());
        }
        if (request.getDescription() != null) {
            classRoom.setDescription(request.getDescription());
        }
        // Teachers are not allowed to reassign class ownership from this endpoint.
        if (request.getPrice() != null) {
            classRoom.setPrice(request.getPrice());
        }
        if (request.getStartDate() != null) {
            classRoom.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            classRoom.setEndDate(request.getEndDate());
        }
        if (request.getMaxStudents() != null) {
            classRoom.setMaxStudents(request.getMaxStudents());
        }
        if (request.getSchedule() != null) {
            classRoom.setSchedule(request.getSchedule());
        }
        if (request.getPoster() != null) {
            classRoom.setPoster(request.getPoster());
        }
        if (request.getActive() != null) {
            classRoom.setActive(request.getActive());
        }

        return classRoomMapper.toResponse(classRoomRepository.save(classRoom));
    }

    @Override
    @Transactional
    public ClassRoomResponse updateOnlineStatus(UUID classId, Boolean onlineOpen, UUID currentTeacherId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (classRoom.getTeacher() == null || !classRoom.getTeacher().getUserId().equals(currentTeacherId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (Boolean.TRUE.equals(onlineOpen)) {
            classRoom.setOnlineOpen(true);
            classRoom.setOnlineRoomCode(generateRandomCode(24));
            classRoom.setOnlineRoomPassword(generateRandomCode(12));
        } else {
            classRoom.setOnlineOpen(false);
            classRoom.setOnlineRoomCode(null);
            classRoom.setOnlineRoomPassword(null);
        }

        ClassRoom saved = classRoomRepository.save(classRoom);

        ClassLiveStatusEventResponse event = ClassLiveStatusEventResponse.builder()
                .classId(saved.getClassId())
                .onlineOpen(Boolean.TRUE.equals(saved.getOnlineOpen()))
                .build();
        messagingTemplate.convertAndSend("/topic/classes/" + saved.getClassId() + "/live-status", event);

        return classRoomMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public OnlineClassAccessResponse getOnlineClassAccess(UUID classId, UUID currentUserId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (!Boolean.TRUE.equals(classRoom.getOnlineOpen())) {
            throw new AppException(ErrorCode.CLASS_ONLINE_NOT_OPEN);
        }

        boolean isTeacherOfClass = classRoom.getTeacher() != null
                && classRoom.getTeacher().getUserId().equals(currentUserId);

        if (!isTeacherOfClass) {
            boolean isEnrolledStudent = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(currentUserId, classId);
            if (!isEnrolledStudent) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        String roomCode = classRoom.getOnlineRoomCode();
        String roomPassword = classRoom.getOnlineRoomPassword();
        if (roomCode == null || roomCode.isBlank() || roomPassword == null || roomPassword.isBlank()) {
            roomCode = generateRandomCode(24);
            roomPassword = generateRandomCode(12);
            classRoom.setOnlineRoomCode(roomCode);
            classRoom.setOnlineRoomPassword(roomPassword);
            classRoomRepository.save(classRoom);
        }

        String roomName = "class-" + classRoom.getClassId() + "-" + roomCode;

        return OnlineClassAccessResponse.builder()
                .classId(classRoom.getClassId())
                .roomName(roomName)
                .roomPassword(roomPassword)
                .onlineOpen(true)
                .teacher(isTeacherOfClass)
                .build();
    }

    @Override
    @Transactional
    public void softDeleteClass(UUID classId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        classRoom.setActive(false);
        classRoomRepository.save(classRoom);
    }

    private String generateRandomCode(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = SECURE_RANDOM.nextInt(ROOM_CHARSET.length());
            builder.append(ROOM_CHARSET.charAt(index));
        }
        return builder.toString();
    }
}

