package org.rent.room.be.serviceImpl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.dto.request.classroom.CreateClassRoomRequest;
import org.rent.room.be.dto.request.classroom.UpdateClassRoomRequest;
import org.rent.room.be.dto.response.classroom.ClassLiveStatusEventResponse;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;
import org.rent.room.be.dto.response.classroom.ClassWalletFinanceSummaryResponse;
import org.rent.room.be.dto.response.classroom.ClassWalletTransactionResponse;
import org.rent.room.be.dto.response.classroom.ClassWalletResponse;
import org.rent.room.be.dto.response.classroom.OnlineClassAccessResponse;
import org.rent.room.be.entity.ClassFavorite;
import org.rent.room.be.entity.ClassRoom;
import org.rent.room.be.entity.Enrollment;
import org.rent.room.be.entity.PlatformCommissionConfig;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WalletTransaction;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.mapper.ClassRoomMapper;
import org.rent.room.be.repository.ClassRoomRepository;
import org.rent.room.be.repository.ClassFavoriteRepository;
import org.rent.room.be.repository.EnrollmentRepository;
import org.rent.room.be.repository.PlatformCommissionConfigRepository;
import org.rent.room.be.repository.QuizAttemptRepository;
import org.rent.room.be.repository.ReviewRepository;
import org.rent.room.be.repository.UserRepository;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.repository.WalletTransactionRepository;
import org.rent.room.be.repository.ClassMeetingRecordingRepository;
import org.rent.room.be.repository.ClassAiChatMessageRepository;
import org.rent.room.be.security.JitsiTokenService;
import org.rent.room.be.service.ClassRoomService;
import org.rent.room.be.service.ChatService;
import org.rent.room.be.service.WalletService;
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
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassRoomServiceImpl implements ClassRoomService {

    private final ClassRoomRepository classRoomRepository;
    private final ClassFavoriteRepository classFavoriteRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ClassMeetingRecordingRepository classMeetingRecordingRepository;
    private final ClassAiChatMessageRepository classAiChatMessageRepository;
    private final ClassRoomMapper classRoomMapper;
    private final ChatService chatService;
    private final WalletService walletService;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final PlatformCommissionConfigRepository platformCommissionConfigRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final JitsiTokenService jitsiTokenService;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String ROOM_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

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
                .classWalletBalance(BigDecimal.ZERO)
                .onlineOpen(false)
                .build();

        ClassRoom savedClass = classRoomRepository.save(classRoom);
        chatService.createClassGroupConversation(savedClass.getClassId(), savedClass.getClassName(), currentTeacherId);
        return classRoomMapper.toResponse(savedClass);
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
            // Rotate room identity each time teacher opens class to invalidate old links.
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
    @Transactional(readOnly = true)
    public ClassWalletResponse getClassWallet(UUID classId, UUID currentTeacherId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        validateTeacherOwnership(classRoom, currentTeacherId);

        return toClassWalletResponse(classRoom);
    }

    @Override
    @Transactional
    public ClassWalletResponse claimClassWallet(UUID classId, UUID currentTeacherId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        validateTeacherOwnership(classRoom, currentTeacherId);

        LocalDateTime now = LocalDateTime.now();
        if (classRoom.getEndDate() == null || now.isBefore(classRoom.getEndDate())) {
            throw new AppException(ErrorCode.CLASS_WALLET_CLAIM_NOT_AVAILABLE);
        }

        BigDecimal classWalletBalance = classRoom.getClassWalletBalance() == null
                ? BigDecimal.ZERO
                : classRoom.getClassWalletBalance();
        if (classWalletBalance.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.CLASS_WALLET_EMPTY);
        }

        BigDecimal feePercent = getCurrentClassWalletFeePercent();
        BigDecimal feeAmount = calculateFeeAmount(classWalletBalance, feePercent);
        BigDecimal receivableAmount = classWalletBalance.subtract(feeAmount).max(BigDecimal.ZERO);

        Wallet teacherWallet = walletService.getOrCreateWallet(classRoom.getTeacher());
        if (teacherWallet.getWalletStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }

        BigDecimal teacherBalanceBefore = teacherWallet.getBalance() == null
                ? BigDecimal.ZERO
                : teacherWallet.getBalance();
        BigDecimal teacherBalanceAfter = teacherBalanceBefore.add(receivableAmount);
        teacherWallet.setBalance(teacherBalanceAfter);
        walletRepository.save(teacherWallet);

        classRoom.setClassWalletBalance(BigDecimal.ZERO);
        classRoom.setClassWalletClaimedAt(now);
        classRoomRepository.save(classRoom);

        walletTransactionRepository.save(WalletTransaction.builder()
                .wallet(teacherWallet)
                .type(WalletTxType.BOOKING_INCOME)
                .status(WalletTxStatus.COMPLETED)
                .amount(receivableAmount)
                .balanceBefore(teacherBalanceBefore)
                .balanceAfter(teacherBalanceAfter)
                .description("Nhận tiền từ ví lớp " + classRoom.getClassName())
                .metadata("{\"classId\":\"" + classRoom.getClassId() + "\",\"grossAmount\":"
                        + classWalletBalance + ",\"feePercent\":" + feePercent
                        + ",\"feeAmount\":" + feeAmount + ",\"receivableAmount\":" + receivableAmount + "}")
                .build());

        return toClassWalletResponse(classRoom);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassWalletTransactionResponse> getClassWalletTransactions(UUID classId, UUID currentTeacherId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        validateTeacherOwnership(classRoom, currentTeacherId);

        return buildClassWalletTransactions(classRoom);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassWalletFinanceSummaryResponse getClassWalletFinanceSummaryForAdmin(UUID classId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        BigDecimal classWalletBalance = safeAmount(classRoom.getClassWalletBalance());
        BigDecimal feePercent = getCurrentClassWalletFeePercent();
        BigDecimal platformUpcomingProfit = calculateFeeAmount(classWalletBalance, feePercent);
        BigDecimal teacherUpcomingReceivable = classWalletBalance.subtract(platformUpcomingProfit).max(BigDecimal.ZERO);

        List<WalletTransaction> claimTransactions = walletRepository.findByUser_UserId(classRoom.getTeacher().getUserId())
                .map(teacherWallet -> walletTransactionRepository.findByWalletAndTypeAndMetadataContainingOrderByCreatedAtDesc(
                        teacherWallet,
                        WalletTxType.BOOKING_INCOME,
                        classRoom.getClassId().toString()
                ))
                .orElseGet(ArrayList::new);

        BigDecimal platformReceivedProfit = BigDecimal.ZERO;
        BigDecimal teacherReceivedAmount = BigDecimal.ZERO;
        for (WalletTransaction claimTx : claimTransactions) {
            BigDecimal feeAmount = extractDecimalFromMetadata(claimTx.getMetadata(), "feeAmount");
            BigDecimal receivableAmount = extractDecimalFromMetadata(claimTx.getMetadata(), "receivableAmount");
            if (feeAmount.compareTo(BigDecimal.ZERO) <= 0) {
                BigDecimal grossAmount = extractDecimalFromMetadata(claimTx.getMetadata(), "grossAmount");
                feeAmount = calculateFeeAmount(grossAmount, feePercent);
            }
            if (receivableAmount.compareTo(BigDecimal.ZERO) <= 0) {
                receivableAmount = safeAmount(claimTx.getAmount());
            }

            platformReceivedProfit = platformReceivedProfit.add(feeAmount);
            teacherReceivedAmount = teacherReceivedAmount.add(receivableAmount);
        }

        return ClassWalletFinanceSummaryResponse.builder()
                .classId(classRoom.getClassId())
                .classWalletBalance(classWalletBalance)
                .platformUpcomingProfit(platformUpcomingProfit)
                .platformReceivedProfit(platformReceivedProfit)
                .teacherUpcomingReceivable(teacherUpcomingReceivable)
                .teacherReceivedAmount(teacherReceivedAmount)
                .feePercent(feePercent)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassWalletTransactionResponse> getClassWalletTransactionsForAdmin(UUID classId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        return buildClassWalletTransactions(classRoom);
    }

    private List<ClassWalletTransactionResponse> buildClassWalletTransactions(ClassRoom classRoom) {
        BigDecimal feePercent = getCurrentClassWalletFeePercent();

        List<ClassWalletTransactionResponse> transactions = new ArrayList<>();

        List<Enrollment> enrollments = enrollmentRepository.findByClassIdOrderByEnrollmentDateAsc(classRoom.getClassId());
        for (Enrollment enrollment : enrollments) {
            BigDecimal amount = enrollment.getPaymentAmount() == null
                    ? BigDecimal.ZERO
                    : enrollment.getPaymentAmount();
            BigDecimal feeAmount = calculateFeeAmount(amount, feePercent);
            BigDecimal receivableAmount = amount.subtract(feeAmount).max(BigDecimal.ZERO);
            transactions.add(ClassWalletTransactionResponse.builder()
                    .transactionId(enrollment.getEnrollmentId())
                    .transactionType("CLASS_WALLET_IN")
                    .amount(amount)
                    .grossAmount(amount)
                    .feeAmount(feeAmount)
                    .receivableAmount(receivableAmount)
                    .transactionTime(enrollment.getEnrollmentDate())
                    .studentName(enrollment.getStudent() != null ? enrollment.getStudent().getUserName() : null)
                    .description("Học sinh nhập học - tiền vào ví lớp")
                    .build());
        }

        walletRepository.findByUser_UserId(classRoom.getTeacher().getUserId()).ifPresent(teacherWallet -> {
            String classIdToken = classRoom.getClassId().toString();
            List<WalletTransaction> claimTransactions =
                    walletTransactionRepository.findByWalletAndTypeAndMetadataContainingOrderByCreatedAtDesc(
                            teacherWallet,
                            WalletTxType.BOOKING_INCOME,
                            classIdToken
                    );

            for (WalletTransaction claimTx : claimTransactions) {
                BigDecimal receivableAmount = extractDecimalFromMetadata(claimTx.getMetadata(), "receivableAmount");
                BigDecimal grossAmount = extractDecimalFromMetadata(claimTx.getMetadata(), "grossAmount");
                BigDecimal feeAmount = extractDecimalFromMetadata(claimTx.getMetadata(), "feeAmount");

                if (receivableAmount.compareTo(BigDecimal.ZERO) <= 0) {
                    receivableAmount = safeAmount(claimTx.getAmount());
                }
                if (grossAmount.compareTo(BigDecimal.ZERO) <= 0) {
                    grossAmount = receivableAmount;
                }
                if (feeAmount.compareTo(BigDecimal.ZERO) <= 0) {
                    feeAmount = grossAmount.subtract(receivableAmount).max(BigDecimal.ZERO);
                }

                transactions.add(ClassWalletTransactionResponse.builder()
                        .transactionId(claimTx.getWalletTransactionId())
                        .transactionType("CLASS_WALLET_OUT")
                        .amount(receivableAmount)
                        .grossAmount(grossAmount)
                        .feeAmount(feeAmount)
                        .receivableAmount(receivableAmount)
                        .transactionTime(claimTx.getCreatedAt())
                        .studentName(null)
                        .description("Giáo viên nhận tiền từ ví lớp")
                        .build());
            }
        });

        transactions.sort(Comparator.comparing(
                ClassWalletTransactionResponse::getTransactionTime,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        return transactions;
    }

    private BigDecimal extractDecimalFromMetadata(String metadata, String key) {
        if (metadata == null || metadata.isBlank() || key == null || key.isBlank()) {
            return BigDecimal.ZERO;
        }

        try {
            JsonNode root = OBJECT_MAPPER.readTree(metadata);
            if (!root.hasNonNull(key)) {
                return BigDecimal.ZERO;
            }
            return safeAmount(root.get(key).decimalValue());
        } catch (Exception ex) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal safeAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    @Override
    @Transactional
    public OnlineClassAccessResponse getOnlineClassAccess(UUID classId, UUID currentUserId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

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
        String jitsiJwt = jitsiTokenService.generateJoinToken(currentUser, roomName, isTeacherOfClass);

        return OnlineClassAccessResponse.builder()
                .classId(classRoom.getClassId())
                .roomName(roomName)
                .roomPassword(roomPassword)
                .jwt(jitsiJwt)
                .tokenTtlSeconds(jitsiTokenService.getTokenTtlSeconds())
                .onlineOpen(true)
                .teacher(isTeacherOfClass)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassRoomResponse> getFavoriteClasses(UUID currentUserId) {
        List<ClassFavorite> favorites = classFavoriteRepository.findByUser_UserIdOrderByCreatedAtDesc(currentUserId);

        return favorites.stream()
                .map(ClassFavorite::getClassRoom)
                .filter(classRoom -> classRoom != null)
                .map(classRoomMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public boolean addFavoriteClass(UUID classId, UUID currentUserId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (classFavoriteRepository.existsByUser_UserIdAndClassRoom_ClassId(currentUserId, classId)) {
            return false;
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        ClassFavorite favorite = ClassFavorite.builder()
                .user(user)
                .classRoom(classRoom)
                .build();

        classFavoriteRepository.save(favorite);
        return true;
    }

    @Override
    @Transactional
    public boolean removeFavoriteClass(UUID classId, UUID currentUserId) {
        if (!classFavoriteRepository.existsByUser_UserIdAndClassRoom_ClassId(currentUserId, classId)) {
            return false;
        }

        classFavoriteRepository.deleteByUser_UserIdAndClassRoom_ClassId(currentUserId, classId);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavoriteClass(UUID classId, UUID currentUserId) {
        return classFavoriteRepository.existsByUser_UserIdAndClassRoom_ClassId(currentUserId, classId);
    }

    @Override
    @Transactional
    public void softDeleteClass(UUID classId, UUID currentUserId) {
        ClassRoom classRoom = classRoomRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        User actor = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        String roleName = actor.getRole() != null ? actor.getRole().getRoleName() : null;
        boolean isAdmin = "ADMIN".equalsIgnoreCase(roleName);
        if (!isAdmin) {
            validateTeacherOwnership(classRoom, currentUserId);
        }

        BigDecimal walletBalance = classRoom.getClassWalletBalance() == null
                ? BigDecimal.ZERO
                : classRoom.getClassWalletBalance();
        if (walletBalance.compareTo(BigDecimal.ZERO) != 0) {
            throw new AppException(ErrorCode.CLASS_WALLET_NOT_ZERO);
        }

        chatService.deleteClassGroupConversation(classId);
        classFavoriteRepository.deleteByClassRoom_ClassId(classId);
        reviewRepository.deleteByClassRoom_ClassId(classId);
        classMeetingRecordingRepository.deleteByClassRoom_ClassId(classId);
        classAiChatMessageRepository.deleteByClassRoom_ClassId(classId);
        quizAttemptRepository.deleteByQuiz_Course_ClassRoom_ClassId(classId);
        enrollmentRepository.deleteByEnrolledClass_ClassId(classId);
        classRoomRepository.delete(classRoom);
    }

    private String generateRandomCode(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = SECURE_RANDOM.nextInt(ROOM_CHARSET.length());
            builder.append(ROOM_CHARSET.charAt(index));
        }
        return builder.toString();
    }

    private ClassWalletResponse toClassWalletResponse(ClassRoom classRoom) {
        BigDecimal balance = classRoom.getClassWalletBalance() == null
                ? BigDecimal.ZERO
                : classRoom.getClassWalletBalance();
        BigDecimal feePercent = getCurrentClassWalletFeePercent();
        BigDecimal feeAmount = calculateFeeAmount(balance, feePercent);
        BigDecimal receivableAmount = balance.subtract(feeAmount).max(BigDecimal.ZERO);
        boolean claimable = classRoom.getEndDate() != null
                && !LocalDateTime.now().isBefore(classRoom.getEndDate())
                && balance.compareTo(BigDecimal.ZERO) > 0;

        return ClassWalletResponse.builder()
                .classId(classRoom.getClassId())
                .balance(balance)
                .feePercent(feePercent)
                .feeAmount(feeAmount)
                .receivableAmount(receivableAmount)
                .claimable(claimable)
                .endDate(classRoom.getEndDate())
                .claimedAt(classRoom.getClassWalletClaimedAt())
                .build();
    }

    private BigDecimal getCurrentClassWalletFeePercent() {
        return platformCommissionConfigRepository
                .findFirstByActiveTrueAndEffectiveToIsNullOrderByEffectiveFromDesc()
                .map(PlatformCommissionConfig::getCommissionRate)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal calculateFeeAmount(BigDecimal grossAmount, BigDecimal feePercent) {
        if (grossAmount == null || grossAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        if (feePercent == null || feePercent.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return grossAmount
                .multiply(feePercent)
                .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
    }

    private void validateTeacherOwnership(ClassRoom classRoom, UUID currentTeacherId) {
        if (classRoom.getTeacher() == null || !classRoom.getTeacher().getUserId().equals(currentTeacherId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }
}

