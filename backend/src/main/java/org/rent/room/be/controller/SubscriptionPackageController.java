package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.subscription.CreatePackageRequest;
import org.rent.room.be.dto.request.subscription.UpdatePackageRequest;
import org.rent.room.be.dto.response.subscription.PackageResponse;
import org.rent.room.be.dto.response.subscription.UserSubscriptionResponse;
import org.rent.room.be.service.SubscriptionPackageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/packages")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Tag(name = "9. Subscription Packages")
public class SubscriptionPackageController {

    SubscriptionPackageService packageService;

    // ==================== PUBLIC ====================

    /**
     * GET /packages/active
     * Lấy danh sách gói đang hoạt động (public, không cần đăng nhập)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PackageResponse>>> getActivePackages() {
        List<PackageResponse> packages = packageService.getActivePackages();
        return ResponseEntity.ok(
                ApiResponse.<List<PackageResponse>>builder()
                        .code(200)
                        .message("Get active packages successfully")
                        .result(packages)
                        .build()
        );
    }

    /**
     * GET /packages/{packageId}
     * Lấy chi tiết một gói (public)
     */
    @GetMapping("/{packageId}")
    public ResponseEntity<ApiResponse<PackageResponse>> getPackageById(@PathVariable UUID packageId) {
        PackageResponse pkg = packageService.getPackageById(packageId);
        return ResponseEntity.ok(
                ApiResponse.<PackageResponse>builder()
                        .code(200)
                        .message("Get package successfully")
                        .result(pkg)
                        .build()
        );
    }

    // ==================== ADMIN ====================

    /**
     * GET /packages/admin/all
     * Admin xem tất cả gói (kể cả inactive)
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<PackageResponse>>> getAllPackages(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        PageResponse<PackageResponse> result = packageService.getAllPackages(page, limit);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<PackageResponse>>builder()
                        .code(200)
                        .message("Get all packages successfully")
                        .result(result)
                        .build()
        );
    }

    /**
     * POST /packages/admin
     * Admin tạo gói mới
     */
    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PackageResponse>> createPackage(
            @Valid @RequestBody CreatePackageRequest request
    ) {
        PackageResponse pkg = packageService.createPackage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<PackageResponse>builder()
                        .code(201)
                        .message("Package created successfully")
                        .result(pkg)
                        .build()
        );
    }

    /**
     * PATCH /packages/admin/{packageId}
     * Admin cập nhật gói
     */
    @PatchMapping("/admin/{packageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PackageResponse>> updatePackage(
            @PathVariable UUID packageId,
            @Valid @RequestBody UpdatePackageRequest request
    ) {
        PackageResponse pkg = packageService.updatePackage(packageId, request);
        return ResponseEntity.ok(
                ApiResponse.<PackageResponse>builder()
                        .code(200)
                        .message("Package updated successfully")
                        .result(pkg)
                        .build()
        );
    }

    /**
     * DELETE /packages/admin/{packageId}
     * Admin xóa (soft-delete / deactivate) gói
     */
    @DeleteMapping("/admin/{packageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable UUID packageId) {
        packageService.deletePackage(packageId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Package deactivated successfully")
                        .build()
        );
    }

    /**
     * GET /packages/admin/subscriptions
     * Admin xem tất cả đơn mua gói, lọc theo userId
     */
    @GetMapping("/admin/subscriptions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<UserSubscriptionResponse>>> getAllSubscriptions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) UUID userId
    ) {
        PageResponse<UserSubscriptionResponse> result = packageService.getAllSubscriptions(page, limit, userId);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<UserSubscriptionResponse>>builder()
                        .code(200)
                        .message("Get all subscriptions successfully")
                        .result(result)
                        .build()
        );
    }

    // ==================== USER ====================

    /**
     * POST /packages/{packageId}/purchase
     * User mua gói (trừ tiền từ ví)
     */
    @PostMapping("/{packageId}/purchase")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserSubscriptionResponse>> purchasePackage(
            @PathVariable UUID packageId
    ) {
        UserSubscriptionResponse subscription = packageService.purchasePackage(packageId);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<UserSubscriptionResponse>builder()
                        .code(201)
                        .message("Package purchased successfully")
                        .result(subscription)
                        .build()
        );
    }

    /**
     * GET /packages/me/subscriptions
     * User xem lịch sử mua gói của mình
     */
    @GetMapping("/me/subscriptions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<UserSubscriptionResponse>>> getMySubscriptions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        PageResponse<UserSubscriptionResponse> result = packageService.getMySubscriptions(page, limit);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<UserSubscriptionResponse>>builder()
                        .code(200)
                        .message("Get my subscriptions successfully")
                        .result(result)
                        .build()
        );
    }

    /**
     * GET /packages/me/active
     * User xem gói đang active hiện tại
     */
    @GetMapping("/me/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserSubscriptionResponse>> getMyActiveSubscription() {
        UserSubscriptionResponse subscription = packageService.getMyActiveSubscription();
        return ResponseEntity.ok(
                ApiResponse.<UserSubscriptionResponse>builder()
                        .code(200)
                        .message(subscription != null ? "Active subscription found" : "No active subscription")
                        .result(subscription)
                        .build()
        );
    }
}
