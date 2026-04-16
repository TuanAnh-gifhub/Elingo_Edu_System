package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.dto.request.enrollment.CreateEnrollmentRequest;
import org.rent.room.be.dto.response.enrollment.EnrollmentResponse;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Enrollment;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WalletTransaction;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.EnrollmentMapper;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.repository.WalletTransactionRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.service.EnrollmentService;
import org.rent.room.be.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final ClassRoomRepository classRoomRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserService userService;
    private final EnrollmentMapper enrollmentMapper;

    @Override
    @Transactional
    public EnrollmentResponse createEnrollment(CreateEnrollmentRequest request) {
        User student = userService.getCurrentUserEntity();
        if (!isStudent(student)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        UUID classId = request.getClassId();
        if (classId == null) {
            throw new AppException(ErrorCode.CLASS_NOT_FOUND);
        }

        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (!classRoom.isActive()) {
            throw new AppException(ErrorCode.CLASS_INACTIVE);
        }

        if (classRoom.getTeacher() != null && classRoom.getTeacher().getUserId().equals(student.getUserId())) {
            throw new AppException(ErrorCode.CLASS_SELF_ENROLL_NOT_ALLOWED);
        }

        Integer currentStudents = classRoom.getCurrentStudents() == null ? 0 : classRoom.getCurrentStudents();
        Integer maxStudents = classRoom.getMaxStudents();
        if (maxStudents != null && currentStudents >= maxStudents) {
            throw new AppException(ErrorCode.CLASS_FULL);
        }

        if (enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(
                student.getUserId(), classId)) {
            throw new AppException(ErrorCode.STUDENT_ALREADY_ENROLLED);
        }

        Wallet studentWallet = walletRepository.findByUser_UserId(student.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        Wallet teacherWallet = walletRepository.findByUser_UserId(classRoom.getTeacher().getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        if (studentWallet.getWalletStatus() == WalletStatus.LOCKED || teacherWallet.getWalletStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }

        BigDecimal classPrice = classRoom.getPrice() == null ? BigDecimal.ZERO : classRoom.getPrice();
        BigDecimal studentBalanceBefore = studentWallet.getBalance() == null ? BigDecimal.ZERO : studentWallet.getBalance();
        if (studentBalanceBefore.compareTo(classPrice) < 0) {
            throw new AppException(ErrorCode.WALLET_INSUFFICIENT_BALANCE);
        }

        BigDecimal studentBalanceAfter = studentBalanceBefore.subtract(classPrice);
        studentWallet.setBalance(studentBalanceAfter);
        walletRepository.save(studentWallet);

        BigDecimal teacherBalanceBefore = teacherWallet.getBalance() == null ? BigDecimal.ZERO : teacherWallet.getBalance();
        BigDecimal teacherBalanceAfter = teacherBalanceBefore.add(classPrice);
        teacherWallet.setBalance(teacherBalanceAfter);
        walletRepository.save(teacherWallet);

        String transactionId = request.getTransactionId();
        if (transactionId == null || transactionId.isBlank()) {
            transactionId = "ENROLL-" + UUID.randomUUID();
        }

        walletTransactionRepository.save(WalletTransaction.builder()
                .wallet(studentWallet)
                .type(WalletTxType.PACKAGE_PURCHASE)
                .status(WalletTxStatus.COMPLETED)
                .amount(classPrice)
                .balanceBefore(studentBalanceBefore)
                .balanceAfter(studentBalanceAfter)
                .description("Thanh toán nhập học lớp " + classRoom.getClassName())
                .metadata("{\"classId\":\"" + classRoom.getClassId() + "\",\"transactionId\":\"" + transactionId + "\"}")
                .build());

        walletTransactionRepository.save(WalletTransaction.builder()
                .wallet(teacherWallet)
                .type(WalletTxType.BOOKING_INCOME)
                .status(WalletTxStatus.COMPLETED)
                .amount(classPrice)
                .balanceBefore(teacherBalanceBefore)
                .balanceAfter(teacherBalanceAfter)
                .description("Thu nhập từ học sinh nhập học lớp " + classRoom.getClassName())
                .metadata("{\"classId\":\"" + classRoom.getClassId() + "\",\"transactionId\":\"" + transactionId + "\"}")
                .build());

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .enrolledClass(classRoom)
                .enrollmentDate(LocalDateTime.now())
                .price(classPrice)
                .paymentAmount(classPrice)
                .paymentStatus(Enrollment.PaymentStatus.PAID)
                .paymentDate(LocalDateTime.now())
                .transactionId(transactionId)
                .notes(request.getNotes())
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        classRoom.setCurrentStudents(currentStudents + 1);
        classRoomRepository.save(classRoom);

        return enrollmentMapper.toResponse(savedEnrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkEnrollment(UUID classId) {
        User student = userService.getCurrentUserEntity();
        return enrollmentRepository.existsByStudent_UserIdAndEnrolledClass_ClassId(student.getUserId(), classId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyEnrollments() {
        User student = userService.getCurrentUserEntity();
        return enrollmentMapper.toResponseList(enrollmentRepository.findByStudent_UserId(student.getUserId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByClassId(UUID classId) {
        classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        return enrollmentMapper.toResponseList(enrollmentRepository.findByEnrolledClass_ClassId(classId));
    }

    private boolean isStudent(User user) {
        return user.getRole() != null
                && user.getRole().getRoleName() != null
                && "STUDENT".equalsIgnoreCase(user.getRole().getRoleName());
    }
}
