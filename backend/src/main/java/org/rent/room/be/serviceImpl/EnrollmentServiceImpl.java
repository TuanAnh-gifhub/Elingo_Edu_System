package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.dto.request.enrollment.CreateEnrollmentRequest;
import org.rent.room.be.dto.response.enrollment.EnrollmentResponse;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Enrollment;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.EnrollmentMapper;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.EnrollmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ClassRoomRepository classRoomRepository;
    private final EnrollmentMapper enrollmentMapper;

    @Override
    @Transactional
    public EnrollmentResponse createEnrollment(CreateEnrollmentRequest request) {
        // Kiểm tra student tồn tại
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Kiểm tra class tồn tại và active
        ClassRoom classRoom = classRoomRepository.findById(request.getClassId())
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (!classRoom.isActive()) {
            throw new AppException(ErrorCode.CLASS_INACTIVE);
        }

        // Kiểm tra class đã đầy chưa
        Integer currentStudents = classRoom.getCurrentStudents() == null ? 0 : classRoom.getCurrentStudents();
        Integer maxStudents = classRoom.getMaxStudents();
        if (maxStudents != null && currentStudents >= maxStudents) {
            throw new AppException(ErrorCode.CLASS_FULL);
        }

        // Kiểm tra học sinh đã đăng ký chưa
        if (enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                request.getStudentId(), request.getClassId())) {
            throw new AppException(ErrorCode.STUDENT_ALREADY_ENROLLED);
        }

        // Tạo enrollment
        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .enrolledClass(classRoom)
                .enrollmentDate(LocalDateTime.now())
                .price(classRoom.getPrice())
                .paymentAmount(request.getPaymentAmount())
                .paymentStatus(Enrollment.PaymentStatus.PAID)
                .paymentDate(LocalDateTime.now())
                .transactionId(request.getTransactionId())
                .notes(request.getNotes())
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        // Tăng currentStudents lên 1
        classRoom.setCurrentStudents(currentStudents + 1);
        classRoomRepository.save(classRoom);

        return enrollmentMapper.toResponse(savedEnrollment);
    }
}
