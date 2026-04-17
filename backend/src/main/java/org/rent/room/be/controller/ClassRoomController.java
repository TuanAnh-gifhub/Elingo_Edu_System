package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.classroom.CreateClassRoomRequest;
import org.rent.room.be.dto.request.classroom.UpdateClassOnlineStatusRequest;
import org.rent.room.be.dto.request.classroom.UpdateClassRoomRequest;
import org.rent.room.be.dto.response.classroom.ClassWalletTransactionResponse;
import org.rent.room.be.dto.response.classroom.ClassWalletResponse;
import org.rent.room.be.dto.response.classroom.ClassWalletFinanceSummaryResponse;
import org.rent.room.be.dto.response.classroom.ClassRoomResponse;
import org.rent.room.be.dto.response.classroom.OnlineClassAccessResponse;
import org.rent.room.be.security.SecurityUtils;
import org.rent.room.be.service.ClassRoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/classes")
@Tag(name = "3. ClassRoom")
public class ClassRoomController {

    ClassRoomService classRoomService;

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<ApiResponse<ClassRoomResponse>> createClass(
            @Valid @RequestBody CreateClassRoomRequest request
    ) {
        UUID currentTeacherId = SecurityUtils.requireCurrentUser().getUserId();
        ClassRoomResponse response = classRoomService.createClass(request, currentTeacherId);
        return ResponseEntity.ok(
                ApiResponse.<ClassRoomResponse>builder()
                        .code(201)
                        .message("Create class successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<ClassRoomResponse>> getClassById(
            @PathVariable UUID classId
    ) {
        ClassRoomResponse response = classRoomService.getById(classId);
        return ResponseEntity.ok(
                ApiResponse.<ClassRoomResponse>builder()
                        .code(200)
                        .message("Get class successfully")
                        .result(response)
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ClassRoomResponse>>> getClasses(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String studyDay,
            @RequestParam(required = false) String studyHour
    ) {
        PageResponse<ClassRoomResponse> result = classRoomService.getClasses(
                page - 1,
                size,
                keyword,
                teacherId,
                active,
                minPrice,
                maxPrice,
                studyDay,
                studyHour
        );
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<ClassRoomResponse>>builder()
                        .code(200)
                        .message("Get classes success")
                        .result(result)
                        .build()
        );
    }

            @PreAuthorize("isAuthenticated()")
            @GetMapping("/favorites")
            public ResponseEntity<ApiResponse<List<ClassRoomResponse>>> getFavoriteClasses() {
                UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
                List<ClassRoomResponse> result = classRoomService.getFavoriteClasses(currentUserId);

                return ResponseEntity.ok(
                        ApiResponse.<List<ClassRoomResponse>>builder()
                                .code(200)
                                .message("Get favorite classes successfully")
                                .result(result)
                                .build()
                );
            }

            @PreAuthorize("isAuthenticated()")
            @PostMapping("/{classId}/favorite")
            public ResponseEntity<ApiResponse<Boolean>> addFavoriteClass(
                    @PathVariable UUID classId
            ) {
                UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
                boolean added = classRoomService.addFavoriteClass(classId, currentUserId);

                return ResponseEntity.ok(
                        ApiResponse.<Boolean>builder()
                                .code(200)
                                .message(added ? "Add favorite class successfully" : "Class already in favorites")
                                .result(added)
                                .build()
                );
            }

            @PreAuthorize("isAuthenticated()")
            @DeleteMapping("/{classId}/favorite")
            public ResponseEntity<ApiResponse<Boolean>> removeFavoriteClass(
                    @PathVariable UUID classId
            ) {
                UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
                boolean removed = classRoomService.removeFavoriteClass(classId, currentUserId);

                return ResponseEntity.ok(
                        ApiResponse.<Boolean>builder()
                                .code(200)
                                .message(removed ? "Remove favorite class successfully" : "Class not in favorites")
                                .result(removed)
                                .build()
                );
            }

            @PreAuthorize("isAuthenticated()")
            @GetMapping("/{classId}/favorite-status")
            public ResponseEntity<ApiResponse<Boolean>> getFavoriteClassStatus(
                    @PathVariable UUID classId
            ) {
                UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
                boolean result = classRoomService.isFavoriteClass(classId, currentUserId);

                return ResponseEntity.ok(
                        ApiResponse.<Boolean>builder()
                                .code(200)
                                .message("Get favorite class status successfully")
                                .result(result)
                                .build()
                );
            }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{classId}")
    public ResponseEntity<ApiResponse<ClassRoomResponse>> updateClass(
            @PathVariable UUID classId,
            @Valid @RequestBody UpdateClassRoomRequest request
    ) {
        UUID currentTeacherId = SecurityUtils.requireCurrentUser().getUserId();
        ClassRoomResponse response = classRoomService.updateClass(classId, request, currentTeacherId);
        return ResponseEntity.ok(
                ApiResponse.<ClassRoomResponse>builder()
                        .code(200)
                        .message("Update class successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PatchMapping("/{classId}/online-status")
    public ResponseEntity<ApiResponse<ClassRoomResponse>> updateOnlineStatus(
            @PathVariable UUID classId,
            @Valid @RequestBody UpdateClassOnlineStatusRequest request
    ) {
        UUID currentTeacherId = SecurityUtils.requireCurrentUser().getUserId();
        ClassRoomResponse response = classRoomService.updateOnlineStatus(classId, request.getOnlineOpen(), currentTeacherId);
        return ResponseEntity.ok(
                ApiResponse.<ClassRoomResponse>builder()
                        .code(200)
                        .message("Update class online status successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/{classId}/wallet")
    public ResponseEntity<ApiResponse<ClassWalletResponse>> getClassWallet(
            @PathVariable UUID classId
    ) {
        UUID currentTeacherId = SecurityUtils.requireCurrentUser().getUserId();
        ClassWalletResponse response = classRoomService.getClassWallet(classId, currentTeacherId);
        return ResponseEntity.ok(
                ApiResponse.<ClassWalletResponse>builder()
                        .code(200)
                        .message("Get class wallet successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/{classId}/wallet/claim")
    public ResponseEntity<ApiResponse<ClassWalletResponse>> claimClassWallet(
            @PathVariable UUID classId
    ) {
        UUID currentTeacherId = SecurityUtils.requireCurrentUser().getUserId();
        ClassWalletResponse response = classRoomService.claimClassWallet(classId, currentTeacherId);
        return ResponseEntity.ok(
                ApiResponse.<ClassWalletResponse>builder()
                        .code(200)
                        .message("Claim class wallet successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/{classId}/wallet/transactions")
    public ResponseEntity<ApiResponse<List<ClassWalletTransactionResponse>>> getClassWalletTransactions(
            @PathVariable UUID classId
    ) {
        UUID currentTeacherId = SecurityUtils.requireCurrentUser().getUserId();
        List<ClassWalletTransactionResponse> response = classRoomService.getClassWalletTransactions(classId, currentTeacherId);
        return ResponseEntity.ok(
                ApiResponse.<List<ClassWalletTransactionResponse>>builder()
                        .code(200)
                        .message("Get class wallet transactions successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{classId}/admin/wallet/finance-summary")
    public ResponseEntity<ApiResponse<ClassWalletFinanceSummaryResponse>> getClassWalletFinanceSummaryForAdmin(
            @PathVariable UUID classId
    ) {
        ClassWalletFinanceSummaryResponse response = classRoomService.getClassWalletFinanceSummaryForAdmin(classId);
        return ResponseEntity.ok(
                ApiResponse.<ClassWalletFinanceSummaryResponse>builder()
                        .code(200)
                        .message("Get class wallet finance summary successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{classId}/admin/wallet/transactions")
    public ResponseEntity<ApiResponse<List<ClassWalletTransactionResponse>>> getClassWalletTransactionsForAdmin(
            @PathVariable UUID classId
    ) {
        List<ClassWalletTransactionResponse> response = classRoomService.getClassWalletTransactionsForAdmin(classId);
        return ResponseEntity.ok(
                ApiResponse.<List<ClassWalletTransactionResponse>>builder()
                        .code(200)
                        .message("Get class wallet transactions for admin successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{classId}/online-access")
    public ResponseEntity<ApiResponse<OnlineClassAccessResponse>> getOnlineAccess(
            @PathVariable UUID classId
    ) {
        UUID currentUserId = SecurityUtils.requireCurrentUser().getUserId();
        OnlineClassAccessResponse response = classRoomService.getOnlineClassAccess(classId, currentUserId);
        return ResponseEntity.ok(
                ApiResponse.<OnlineClassAccessResponse>builder()
                        .code(200)
                        .message("Get online class access successfully")
                        .result(response)
                        .build()
        );
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @DeleteMapping("/{classId}")
    public ResponseEntity<ApiResponse<Void>> deleteClass(
            @PathVariable UUID classId
    ) {
        classRoomService.softDeleteClass(classId);
        return ResponseEntity.ok(
            ApiResponse.<Void>builder()
                    .code(200)
                    .message("Delete class successfully (soft delete)")
                    .build()
        );
    }
}

