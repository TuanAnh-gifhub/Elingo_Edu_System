package org.rent.room.be.repository;

import org.rent.room.be.constant.SubscriptionStatus;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.UserSubscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {

    Page<UserSubscription> findByUser(User user, Pageable pageable);

    Page<UserSubscription> findAll(Pageable pageable);

    Page<UserSubscription> findByUser_UserId(UUID userId, Pageable pageable);

    Optional<UserSubscription> findFirstByUserAndStatusOrderByEndDateDesc(User user, SubscriptionStatus status);

    List<UserSubscription> findByUserAndStatusOrderByEndDateDesc(User user, SubscriptionStatus status);

    List<UserSubscription> findByStatusAndEndDateBefore(SubscriptionStatus status, LocalDateTime now);
}
