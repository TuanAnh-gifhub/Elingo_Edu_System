package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.request.subscription.CreatePackageRequest;
import org.rent.room.be.dto.request.subscription.UpdatePackageRequest;
import org.rent.room.be.dto.response.subscription.PackageResponse;
import org.rent.room.be.dto.response.subscription.UserSubscriptionResponse;

import java.util.List;
import java.util.UUID;

public interface SubscriptionPackageService {

    // ---- Admin APIs ----
    PackageResponse createPackage(CreatePackageRequest request);

    PackageResponse updatePackage(UUID packageId, UpdatePackageRequest request);

    void deletePackage(UUID packageId);

    PageResponse<PackageResponse> getAllPackages(int page, int limit);

    // ---- Public / User APIs ----
    List<PackageResponse> getActivePackages();

    PackageResponse getPackageById(UUID packageId);

    // ---- Subscription APIs ----
    UserSubscriptionResponse purchasePackage(UUID packageId);

    PageResponse<UserSubscriptionResponse> getMySubscriptions(int page, int limit);

    UserSubscriptionResponse getMyActiveSubscription();

    // ---- Admin: view all subscriptions ----
    PageResponse<UserSubscriptionResponse> getAllSubscriptions(int page, int limit, UUID userId);
}
