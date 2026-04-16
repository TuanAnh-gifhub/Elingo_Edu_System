package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.classroom.CreateClassRoomRequest;
import org.rent.room.be.dto.request.classroom.UpdateClassRoomRequest;
import org.rent.room.be.dto.response.classroom.ClassWalletTransactionResponse;
import org.rent.room.be.dto.response.classroom.ClassWalletResponse;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;
import org.rent.room.be.dto.response.classroom.OnlineClassAccessResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ClassRoomService {

    ClassRoomResponse createClass(CreateClassRoomRequest request, UUID currentTeacherId);

    ClassRoomResponse getById(UUID classId);

    PageResponse<ClassRoomResponse> getClasses(
            int page,
            int size,
            String keyword,
            UUID teacherId,
            Boolean active,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String studyDay,
            String studyHour
    );

    ClassRoomResponse updateClass(UUID classId, UpdateClassRoomRequest request, UUID currentTeacherId);

    ClassRoomResponse updateOnlineStatus(UUID classId, Boolean onlineOpen, UUID currentTeacherId);

    ClassWalletResponse getClassWallet(UUID classId, UUID currentTeacherId);

    ClassWalletResponse claimClassWallet(UUID classId, UUID currentTeacherId);

    List<ClassWalletTransactionResponse> getClassWalletTransactions(UUID classId, UUID currentTeacherId);

    OnlineClassAccessResponse getOnlineClassAccess(UUID classId, UUID currentUserId);

    void softDeleteClass(UUID classId);
}

