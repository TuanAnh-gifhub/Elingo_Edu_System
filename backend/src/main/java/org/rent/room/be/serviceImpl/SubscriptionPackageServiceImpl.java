package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.SubscriptionStatus;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.dto.request.subscription.CreatePackageRequest;
import org.rent.room.be.dto.request.subscription.UpdatePackageRequest;
import org.rent.room.be.dto.response.subscription.PackageResponse;
import org.rent.room.be.dto.response.subscription.UserSubscriptionResponse;
import org.rent.room.be.entity.*;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.repository.*;
import org.rent.room.be.service.SubscriptionPackageService;
import org.rent.room.be.service.UserService;
import org.rent.room.be.service.WalletService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionPackageServiceImpl implements SubscriptionPackageService {

    private final SubscriptionPackageRepository packageRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserService userService;
    private final WalletService walletService;

    // ==================== ADMIN APIs ====================

    @Override
    @Transactional
    public PackageResponse createPackage(CreatePackageRequest request) {
        SubscriptionPackage pkg = SubscriptionPackage.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .durationDays(request.getDurationDays())
                .maxClassesPerMonth(request.getMaxClassesPerMonth())
                .maxCourses(request.getMaxCourses())
                .active(true)
                .build();

        SubscriptionPackage saved = packageRepository.save(pkg);
        log.info("Admin created package: {}", saved.getPackageId());
        return toPackageResponse(saved);
    }

    @Override
    @Transactional
    public PackageResponse updatePackage(UUID packageId, UpdatePackageRequest request) {
        SubscriptionPackage pkg = findPackageOrThrow(packageId);

        if (request.getName() != null) pkg.setName(request.getName());
        if (request.getDescription() != null) pkg.setDescription(request.getDescription());
        if (request.getPrice() != null) pkg.setPrice(request.getPrice());
        if (request.getDurationDays() != null) pkg.setDurationDays(request.getDurationDays());
        if (request.getMaxClassesPerMonth() != null) pkg.setMaxClassesPerMonth(request.getMaxClassesPerMonth());
        if (request.getMaxCourses() != null) pkg.setMaxCourses(request.getMaxCourses());
        if (request.getActive() != null) pkg.setActive(request.getActive());

        SubscriptionPackage saved = packageRepository.save(pkg);
        log.info("Admin updated package: {}", packageId);
        return toPackageResponse(saved);
    }

    @Override
    @Transactional
    public void deletePackage(UUID packageId) {
        SubscriptionPackage pkg = findPackageOrThrow(packageId);
        // Soft delete by deactivating
        pkg.setActive(false);
        packageRepository.save(pkg);
        log.info("Admin deactivated package: {}", packageId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PackageResponse> getAllPackages(int page, int limit) {
        page = Math.max(page, 1);
        limit = Math.min(Math.max(limit, 1), 100);
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SubscriptionPackage> pageData = packageRepository.findAll(pageable);
        return buildPageResponse(pageData);
    }

    // ==================== PUBLIC APIs ====================

    @Override
    @Transactional(readOnly = true)
    public List<PackageResponse> getActivePackages() {
        return packageRepository.findAllByActiveTrue()
                .stream()
                .map(this::toPackageResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PackageResponse getPackageById(UUID packageId) {
        return toPackageResponse(findPackageOrThrow(packageId));
    }

    // ==================== USER (Purchase) API ====================

    @Override
    @Transactional
    public UserSubscriptionResponse purchasePackage(UUID packageId) {
        User currentUser = userService.getCurrentUserEntity();
        SubscriptionPackage pkg = findPackageOrThrow(packageId);
        LocalDateTime now = LocalDateTime.now();
        List<UserSubscription> activeSubscriptions = resolveCurrentActiveSubscriptions(currentUser, now);

        if (!pkg.isActive()) {
            throw new AppException(ErrorCode.SUBSCRIPTION_PACKAGE_INACTIVE);
        }

        boolean isSamePackageActive = activeSubscriptions.stream()
                .anyMatch(subscription -> subscription.getSubscriptionPackage().getPackageId().equals(packageId));
        if (isSamePackageActive) {
            throw new AppException(ErrorCode.SUBSCRIPTION_ALREADY_ACTIVE);
        }

        if (!activeSubscriptions.isEmpty()) {
            activeSubscriptions.forEach(subscription -> {
                subscription.setStatus(SubscriptionStatus.CANCELLED);
                subscription.setEndDate(now);
            });
            subscriptionRepository.saveAll(activeSubscriptions);
        }

        Wallet wallet = walletService.getOrCreateWallet(currentUser);

        if (wallet.getWalletStatus() == WalletStatus.LOCKED) {
            throw new AppException(ErrorCode.WALLET_LOCKED);
        }

        BigDecimal price = pkg.getPrice();
        BigDecimal available = wallet.getBalance().subtract(wallet.getFrozenAmount());

        if (available.compareTo(price) < 0) {
            throw new AppException(ErrorCode.WALLET_INSUFFICIENT_BALANCE);
        }

        // Deduct balance
        BigDecimal balanceBefore = wallet.getBalance();
        BigDecimal balanceAfter = balanceBefore.subtract(price);
        wallet.setBalance(balanceAfter);
        walletRepository.save(wallet);

        // Record wallet transaction
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTxType.PACKAGE_PURCHASE)
                .status(WalletTxStatus.COMPLETED)
                .amount(price)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .description("Mua gói: " + pkg.getName())
                .build();
        WalletTransaction savedTx = walletTransactionRepository.save(tx);

        // Create subscription
        LocalDateTime endDate = now.plusDays(pkg.getDurationDays());

        UserSubscription subscription = UserSubscription.builder()
                .user(currentUser)
                .subscriptionPackage(pkg)
                .startDate(now)
                .endDate(endDate)
                .status(SubscriptionStatus.ACTIVE)
                .amountPaid(price)
                .walletTransactionId(savedTx.getWalletTransactionId())
                .build();

        UserSubscription saved = subscriptionRepository.save(subscription);
        log.info("User {} purchased package {}, subscription {}", currentUser.getUserId(), packageId, saved.getSubscriptionId());
        return toSubscriptionResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserSubscriptionResponse> getMySubscriptions(int page, int limit) {
        page = Math.max(page, 1);
        limit = Math.min(Math.max(limit, 1), 100);
        User currentUser = userService.getCurrentUserEntity();
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserSubscription> pageData = subscriptionRepository.findByUser(currentUser, pageable);

        return PageResponse.<UserSubscriptionResponse>builder()
                .currentPage(pageData.getNumber() + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(pageData.getContent().stream().map(this::toSubscriptionResponse).toList())
                .build();
    }

    @Override
    @Transactional
    public UserSubscriptionResponse getMyActiveSubscription() {
        User currentUser = userService.getCurrentUserEntity();
        LocalDateTime now = LocalDateTime.now();
        List<UserSubscription> activeSubscriptions = resolveCurrentActiveSubscriptions(currentUser, now);
        if (activeSubscriptions.isEmpty()) {
            return null;
        }

        return toSubscriptionResponse(activeSubscriptions.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserSubscriptionResponse> getAllSubscriptions(int page, int limit, UUID userId) {
        page = Math.max(page, 1);
        limit = Math.min(Math.max(limit, 1), 100);
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<UserSubscription> pageData;
        if (userId != null) {
            pageData = subscriptionRepository.findByUser_UserId(userId, pageable);
        } else {
            pageData = subscriptionRepository.findAll(pageable);
        }

        return PageResponse.<UserSubscriptionResponse>builder()
                .currentPage(pageData.getNumber() + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(pageData.getContent().stream().map(this::toSubscriptionResponse).toList())
                .build();
    }

    // ==================== Helpers ====================

    private SubscriptionPackage findPackageOrThrow(UUID packageId) {
        return packageRepository.findById(packageId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBSCRIPTION_PACKAGE_NOT_FOUND));
    }

    private List<UserSubscription> resolveCurrentActiveSubscriptions(User user, LocalDateTime now) {
        List<UserSubscription> activeSubscriptions =
                subscriptionRepository.findByUserAndStatusOrderByEndDateDesc(user, SubscriptionStatus.ACTIVE);

        if (activeSubscriptions.isEmpty()) {
            return List.of();
        }

        List<UserSubscription> expiredSubscriptions = activeSubscriptions.stream()
                .filter(subscription -> !subscription.getEndDate().isAfter(now))
                .toList();

        if (!expiredSubscriptions.isEmpty()) {
            expiredSubscriptions.forEach(subscription -> subscription.setStatus(SubscriptionStatus.EXPIRED));
            subscriptionRepository.saveAll(expiredSubscriptions);
        }

        return activeSubscriptions.stream()
                .filter(subscription -> subscription.getEndDate().isAfter(now))
                .toList();
    }

    private PackageResponse toPackageResponse(SubscriptionPackage pkg) {
        return PackageResponse.builder()
                .packageId(pkg.getPackageId())
                .name(pkg.getName())
                .description(pkg.getDescription())
                .price(pkg.getPrice())
                .durationDays(pkg.getDurationDays())
                .maxClassesPerMonth(pkg.getMaxClassesPerMonth())
                .maxCourses(pkg.getMaxCourses())
                .active(pkg.isActive())
                .createdAt(pkg.getCreatedAt())
                .updatedAt(pkg.getUpdatedAt())
                .build();
    }

    private UserSubscriptionResponse toSubscriptionResponse(UserSubscription sub) {
        User user = sub.getUser();
        SubscriptionPackage pkg = sub.getSubscriptionPackage();
        return UserSubscriptionResponse.builder()
                .subscriptionId(sub.getSubscriptionId())
                .userId(user.getUserId())
                .userName(user.getUserName())
                .userEmail(user.getEmail())
                .packageId(pkg.getPackageId())
                .packageName(pkg.getName())
                .amountPaid(sub.getAmountPaid())
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .status(sub.getStatus())
                .createdAt(sub.getCreatedAt())
                .build();
    }

    private PageResponse<PackageResponse> buildPageResponse(Page<SubscriptionPackage> pageData) {
        return PageResponse.<PackageResponse>builder()
                .currentPage(pageData.getNumber() + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(pageData.getContent().stream().map(this::toPackageResponse).toList())
                .build();
    }
}
