package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.classroom.CreateClassRoomRequest;
import org.rent.room.be.dto.request.classroom.UpdateClassRoomRequest;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Enrollment;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.ClassRoomMapper;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.ClassRoomService;
import org.rent.room.be.service.UserService;
import org.rent.room.be.specification.ClassRoomSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassRoomServiceImpl implements ClassRoomService {

    private final ClassRoomRepository classRoomRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserService userService;
    private final ClassRoomMapper classRoomMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public ClassRoomResponse createClass(CreateClassRoomRequest request) {
        User teacher = userRepository.findById(request.getTeacherId())
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
                .joinCodeRequired(Boolean.TRUE.equals(request.getJoinCodeRequired()))
                .joinCodeHash(encodeJoinCode(request.getJoinCode()))
                .build();

        if (classRoom.isJoinCodeRequired() && classRoom.getJoinCodeHash() == null) {
            throw new AppException(ErrorCode.CLASS_JOIN_CODE_INVALID);
        }

        return classRoomMapper.toResponse(classRoomRepository.save(classRoom));
    }

    @Override
    public ClassRoomResponse getById(UUID classId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        return classRoomMapper.toResponse(classRoom);
    }

    @Override
    public PageResponse<ClassRoomResponse> getClasses(int page, int size, String keyword, UUID teacherId, Boolean active) {
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<ClassRoom> spec = ClassRoomSpecification.filterClasses(keyword, teacherId, active);

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
    public ClassRoomResponse updateClass(UUID classId, UpdateClassRoomRequest request) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (request.getClassName() != null) {
            classRoom.setClassName(request.getClassName());
        }
        if (request.getDescription() != null) {
            classRoom.setDescription(request.getDescription());
        }
        if (request.getTeacherId() != null) {
            User teacher = userRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            classRoom.setTeacher(teacher);
        }
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
        if (request.getJoinCodeRequired() != null) {
            classRoom.setJoinCodeRequired(request.getJoinCodeRequired());
        }
        if (request.getJoinCode() != null) {
            classRoom.setJoinCodeHash(encodeJoinCode(request.getJoinCode()));
        }
        if (classRoom.isJoinCodeRequired() && classRoom.getJoinCodeHash() == null) {
            throw new AppException(ErrorCode.CLASS_JOIN_CODE_INVALID);
        }
        if (request.getActive() != null) {
            classRoom.setActive(request.getActive());
        }

        return classRoomMapper.toResponse(classRoomRepository.save(classRoom));
    }

    @Override
    @Transactional
    public void softDeleteClass(UUID classId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        classRoom.setActive(false);
        classRoomRepository.save(classRoom);
    }

    @Override
    @Transactional
    public void joinClass(UUID classId, String joinCode) {
        User student = userService.getCurrentUserEntity();
        if (!"STUDENT".equalsIgnoreCase(student.getRole().getRoleName())) {
            throw new AppException(ErrorCode.SUBMISSION_FORBIDDEN);
        }

        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        boolean joined = enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                student.getUserId(),
                classId
        );
        if (joined) {
            return;
        }

        if (classRoom.getMaxStudents() != null
                && classRoom.getCurrentStudents() != null
                && classRoom.getCurrentStudents() >= classRoom.getMaxStudents()) {
            throw new AppException(ErrorCode.CLASS_FULL);
        }

        if (classRoom.isJoinCodeRequired()) {
            if (joinCode == null || joinCode.isBlank() || classRoom.getJoinCodeHash() == null
                    || !passwordEncoder.matches(joinCode.trim(), classRoom.getJoinCodeHash())) {
                throw new AppException(ErrorCode.CLASS_JOIN_CODE_INVALID);
            }
        }

        BigDecimal price = classRoom.getPrice() != null ? classRoom.getPrice() : BigDecimal.ZERO;
        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .enrolledClass(classRoom)
                .enrollmentDate(LocalDateTime.now())
                .price(price)
                .paymentAmount(price)
                .paymentStatus(Enrollment.PaymentStatus.PAID)
                .paymentDate(LocalDateTime.now())
                .transactionId("JOIN-" + UUID.randomUUID())
                .notes("Joined assignment group")
                .build();

        enrollmentRepository.save(enrollment);
        int currentStudents = classRoom.getCurrentStudents() == null ? 0 : classRoom.getCurrentStudents();
        classRoom.setCurrentStudents(currentStudents + 1);
        classRoomRepository.save(classRoom);
    }

    @Override
    public List<UUID> getJoinedClassIds() {
        User student = userService.getCurrentUserEntity();
        if (!"STUDENT".equalsIgnoreCase(student.getRole().getRoleName())) {
            return List.of();
        }
        return enrollmentRepository.findJoinedClassIdsByStudentId(student.getUserId());
    }

    private String encodeJoinCode(String rawJoinCode) {
        if (rawJoinCode == null) {
            return null;
        }
        String trimmed = rawJoinCode.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return passwordEncoder.encode(trimmed);
    }
}

