package org.rent.room.be.serviceImpl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.dto.response.wallet.AdminDepositTrendBucketResponse;
import org.rent.room.be.dto.response.wallet.AdminDepositTrendResultResponse;
import org.rent.room.be.dto.response.wallet.AdminDepositTransactionSummaryResponse;
import org.rent.room.be.dto.response.wallet.AdminPlatformIncomeBucketResponse;
import org.rent.room.be.dto.response.wallet.AdminPlatformIncomeTrendResponse;
import org.rent.room.be.dto.response.wallet.AdminWalletItemResponse;
import org.rent.room.be.dto.response.wallet.AdminWalletTransactionItemResponse;
import org.rent.room.be.entity.UserSubscription;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.WalletTransaction;
import org.rent.room.be.repository.UserSubscriptionRepository;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.repository.WalletTransactionRepository;
import org.rent.room.be.service.WalletAdminQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletAdminQueryServiceImpl implements WalletAdminQueryService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminWalletItemResponse> getAllWallets(
            int page,
            int limit,
            String keyword,
            String walletStatus,
            UUID userId
    ) {
        int normalizedPage = Math.max(page, 1);
        int normalizedLimit = Math.min(Math.max(limit, 1), 100);
        Pageable pageable = PageRequest.of(normalizedPage - 1, normalizedLimit,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Wallet> specification = buildWalletSpecification(keyword, walletStatus, userId);
        Page<Wallet> walletPage = walletRepository.findAll(specification, pageable);

        return PageResponse.<AdminWalletItemResponse>builder()
                .currentPage(walletPage.getNumber() + 1)
                .totalPages(walletPage.getTotalPages())
                .pageSize(walletPage.getSize())
                .totalElements(walletPage.getTotalElements())
                .data(walletPage.getContent().stream().map(this::toAdminWalletItem).toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminWalletTransactionItemResponse> getAllTransactions(
            int page,
            int limit,
            String type,
            String status,
            String fromDate,
            String toDate,
            String keyword,
            UUID userId,
            UUID walletId
    ) {
        int normalizedPage = Math.max(page, 1);
        int normalizedLimit = Math.min(Math.max(limit, 1), 100);
        Pageable pageable = PageRequest.of(normalizedPage - 1, normalizedLimit,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        LocalDateTime from = parseDateOrDefault(fromDate, LocalDate.now().minusMonths(1).atStartOfDay(), false);
        LocalDateTime to = parseDateOrDefault(toDate, LocalDateTime.now(), true);

        Specification<WalletTransaction> specification =
                buildTransactionSpecification(type, status, from, to, keyword, userId, walletId);
        Page<WalletTransaction> txPage = walletTransactionRepository.findAll(specification, pageable);

        return PageResponse.<AdminWalletTransactionItemResponse>builder()
                .currentPage(txPage.getNumber() + 1)
                .totalPages(txPage.getTotalPages())
                .pageSize(txPage.getSize())
                .totalElements(txPage.getTotalElements())
                .data(txPage.getContent().stream().map(this::toAdminTransactionItem).toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDepositTransactionSummaryResponse getAdminDepositTransactionSummary(String fromDate, String toDate) {
        LocalDateTime from = parseDateOrDefault(fromDate, LocalDate.now().minusMonths(1).atStartOfDay(), false);
        LocalDateTime to = parseDateOrDefault(toDate, LocalDateTime.now(), true);

        List<Object[]> summaryRows = walletTransactionRepository
                .summarizeByTypeAndCreatedAtBetween(WalletTxType.DEPOSIT, from, to);
        Object[] summary = summaryRows.isEmpty() ? new Object[0] : summaryRows.get(0);

        return AdminDepositTransactionSummaryResponse.builder()
                .totalDeposits(toLong(summary, 0))
                .completedDeposits(toLong(summary, 1))
                .failedDeposits(toLong(summary, 2))
                .pendingDeposits(toLong(summary, 3))
                .cancelledDeposits(toLong(summary, 4))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDepositTrendResultResponse getAdminDepositTrend(String fromDate, String toDate) {
        LocalDateTime from = parseDateOrDefault(fromDate, LocalDate.now().minusMonths(1).atStartOfDay(), false);
        LocalDateTime to = parseDateOrDefault(toDate, LocalDateTime.now(), true);

        if (to.isBefore(from)) {
            LocalDateTime temp = from;
            from = to;
            to = temp;
        }

        Map<LocalDate, BigDecimal> dailyAmountMap = new LinkedHashMap<>();
        Map<YearMonth, BigDecimal> monthlyAmountMap = new LinkedHashMap<>();
        Map<LocalDate, Set<UUID>> dailyUserSetMap = new LinkedHashMap<>();
        Map<YearMonth, Set<UUID>> monthlyUserSetMap = new LinkedHashMap<>();

        seedDepositDateBuckets(from.toLocalDate(), to.toLocalDate(), dailyAmountMap, dailyUserSetMap);
        seedDepositMonthBuckets(from.toLocalDate(), to.toLocalDate(), monthlyAmountMap, monthlyUserSetMap);

        List<WalletTransaction> completedDeposits = walletTransactionRepository.findByTypeAndStatusAndCreatedAtBetween(
                WalletTxType.DEPOSIT,
                WalletTxStatus.COMPLETED,
                from,
                to
        );

        Set<UUID> totalDepositingUsers = new HashSet<>();
        for (WalletTransaction tx : completedDeposits) {
            if (tx.getCreatedAt() == null) {
                continue;
            }

            LocalDate day = tx.getCreatedAt().toLocalDate();
            YearMonth month = YearMonth.from(day);
            BigDecimal amount = safeAmount(tx.getAmount());

            dailyAmountMap.computeIfPresent(day, (k, value) -> value.add(amount));
            monthlyAmountMap.computeIfPresent(month, (k, value) -> value.add(amount));

            UUID userId = tx.getWallet() != null && tx.getWallet().getUser() != null
                    ? tx.getWallet().getUser().getUserId()
                    : null;
            if (userId != null) {
                totalDepositingUsers.add(userId);
                dailyUserSetMap.computeIfPresent(day, (k, value) -> {
                    value.add(userId);
                    return value;
                });
                monthlyUserSetMap.computeIfPresent(month, (k, value) -> {
                    value.add(userId);
                    return value;
                });
            }
        }

        List<AdminDepositTrendBucketResponse> daily = new ArrayList<>();
        dailyAmountMap.forEach((day, amount) -> daily.add(AdminDepositTrendBucketResponse.builder()
                .period(day.format(DAY_FORMATTER))
                .totalAmount(amount)
                .depositingUsers((long) dailyUserSetMap.getOrDefault(day, Set.of()).size())
                .build()));

        List<AdminDepositTrendBucketResponse> monthly = new ArrayList<>();
        monthlyAmountMap.forEach((month, amount) -> monthly.add(AdminDepositTrendBucketResponse.builder()
                .period(month.format(MONTH_FORMATTER))
                .totalAmount(amount)
                .depositingUsers((long) monthlyUserSetMap.getOrDefault(month, Set.of()).size())
                .build()));

        BigDecimal totalAmount = daily.stream()
                .map(AdminDepositTrendBucketResponse::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminDepositTrendResultResponse.builder()
                .fromDate(from.toString())
                .toDate(to.toString())
                .totalAmount(totalAmount)
                .totalDepositingUsers((long) totalDepositingUsers.size())
                .daily(daily)
                .monthly(monthly)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPlatformIncomeTrendResponse getAdminPlatformIncomeTrend(String fromDate, String toDate) {
        LocalDateTime from = parseDateOrDefault(fromDate, LocalDate.now().minusMonths(1).atStartOfDay(), false);
        LocalDateTime to = parseDateOrDefault(toDate, LocalDateTime.now(), true);

        if (to.isBefore(from)) {
            LocalDateTime temp = from;
            from = to;
            to = temp;
        }

        Map<LocalDate, BigDecimal> dailySubscriptionMap = new LinkedHashMap<>();
        Map<LocalDate, BigDecimal> dailyCommissionMap = new LinkedHashMap<>();
        Map<YearMonth, BigDecimal> monthlySubscriptionMap = new LinkedHashMap<>();
        Map<YearMonth, BigDecimal> monthlyCommissionMap = new LinkedHashMap<>();

        seedDateBuckets(from.toLocalDate(), to.toLocalDate(), dailySubscriptionMap, dailyCommissionMap);
        seedMonthBuckets(from.toLocalDate(), to.toLocalDate(), monthlySubscriptionMap, monthlyCommissionMap);

        List<UserSubscription> subscriptions = userSubscriptionRepository.findByCreatedAtBetween(from, to);
        for (UserSubscription subscription : subscriptions) {
            LocalDateTime createdAt = subscription.getCreatedAt();
            if (createdAt == null) {
                continue;
            }
            BigDecimal amountPaid = safeAmount(subscription.getAmountPaid());
            LocalDate day = createdAt.toLocalDate();
            YearMonth month = YearMonth.from(day);

            dailySubscriptionMap.computeIfPresent(day, (k, value) -> value.add(amountPaid));
            monthlySubscriptionMap.computeIfPresent(month, (k, value) -> value.add(amountPaid));
        }

        List<WalletTransaction> commissionTransactions = walletTransactionRepository.findByTypeAndStatusAndCreatedAtBetween(
                WalletTxType.BOOKING_INCOME,
                WalletTxStatus.COMPLETED,
                from,
                to
        );
        for (WalletTransaction tx : commissionTransactions) {
            LocalDateTime createdAt = tx.getCreatedAt();
            if (createdAt == null) {
                continue;
            }

            BigDecimal feeAmount = extractDecimalFromMetadata(tx.getMetadata(), "feeAmount");
            if (feeAmount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            LocalDate day = createdAt.toLocalDate();
            YearMonth month = YearMonth.from(day);
            dailyCommissionMap.computeIfPresent(day, (k, value) -> value.add(feeAmount));
            monthlyCommissionMap.computeIfPresent(month, (k, value) -> value.add(feeAmount));
        }

        List<AdminPlatformIncomeBucketResponse> daily = new ArrayList<>();
        dailySubscriptionMap.forEach((day, subscriptionIncome) -> {
            BigDecimal commissionIncome = safeAmount(dailyCommissionMap.get(day));
            BigDecimal totalIncome = subscriptionIncome.add(commissionIncome);
            daily.add(AdminPlatformIncomeBucketResponse.builder()
                    .period(day.format(DAY_FORMATTER))
                    .subscriptionIncome(subscriptionIncome)
                    .commissionIncome(commissionIncome)
                    .totalIncome(totalIncome)
                    .build());
        });

        List<AdminPlatformIncomeBucketResponse> monthly = new ArrayList<>();
        monthlySubscriptionMap.forEach((month, subscriptionIncome) -> {
            BigDecimal commissionIncome = safeAmount(monthlyCommissionMap.get(month));
            BigDecimal totalIncome = subscriptionIncome.add(commissionIncome);
            monthly.add(AdminPlatformIncomeBucketResponse.builder()
                    .period(month.format(MONTH_FORMATTER))
                    .subscriptionIncome(subscriptionIncome)
                    .commissionIncome(commissionIncome)
                    .totalIncome(totalIncome)
                    .build());
        });

        BigDecimal totalSubscriptionIncome = daily.stream()
                .map(AdminPlatformIncomeBucketResponse::getSubscriptionIncome)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCommissionIncome = daily.stream()
                .map(AdminPlatformIncomeBucketResponse::getCommissionIncome)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminPlatformIncomeTrendResponse.builder()
                .fromDate(from.toString())
                .toDate(to.toString())
                .totalSubscriptionIncome(totalSubscriptionIncome)
                .totalCommissionIncome(totalCommissionIncome)
                .totalIncome(totalSubscriptionIncome.add(totalCommissionIncome))
                .daily(daily)
                .monthly(monthly)
                .build();
    }

    private void seedDateBuckets(
            LocalDate fromDate,
            LocalDate toDate,
            Map<LocalDate, BigDecimal> subscriptionMap,
            Map<LocalDate, BigDecimal> commissionMap
    ) {
        LocalDate cursor = fromDate;
        while (!cursor.isAfter(toDate)) {
            subscriptionMap.put(cursor, BigDecimal.ZERO);
            commissionMap.put(cursor, BigDecimal.ZERO);
            cursor = cursor.plusDays(1);
        }
    }

    private void seedMonthBuckets(
            LocalDate fromDate,
            LocalDate toDate,
            Map<YearMonth, BigDecimal> subscriptionMap,
            Map<YearMonth, BigDecimal> commissionMap
    ) {
        YearMonth cursor = YearMonth.from(fromDate);
        YearMonth end = YearMonth.from(toDate);

        while (!cursor.isAfter(end)) {
            subscriptionMap.put(cursor, BigDecimal.ZERO);
            commissionMap.put(cursor, BigDecimal.ZERO);
            cursor = cursor.plusMonths(1);
        }
    }

    private void seedDepositDateBuckets(
            LocalDate fromDate,
            LocalDate toDate,
            Map<LocalDate, BigDecimal> amountMap,
            Map<LocalDate, Set<UUID>> userSetMap
    ) {
        LocalDate cursor = fromDate;
        while (!cursor.isAfter(toDate)) {
            amountMap.put(cursor, BigDecimal.ZERO);
            userSetMap.put(cursor, new HashSet<>());
            cursor = cursor.plusDays(1);
        }
    }

    private void seedDepositMonthBuckets(
            LocalDate fromDate,
            LocalDate toDate,
            Map<YearMonth, BigDecimal> amountMap,
            Map<YearMonth, Set<UUID>> userSetMap
    ) {
        YearMonth cursor = YearMonth.from(fromDate);
        YearMonth end = YearMonth.from(toDate);
        while (!cursor.isAfter(end)) {
            amountMap.put(cursor, BigDecimal.ZERO);
            userSetMap.put(cursor, new HashSet<>());
            cursor = cursor.plusMonths(1);
        }
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

    private BigDecimal safeAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Specification<Wallet> buildWalletSpecification(String keyword, String walletStatus, UUID userId) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (userId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("user").get("userId"), userId));
            }

            if (walletStatus != null && !walletStatus.isBlank()) {
                try {
                    WalletStatus parsedStatus = WalletStatus.valueOf(walletStatus.trim().toUpperCase(Locale.ROOT));
                    predicate = cb.and(predicate, cb.equal(root.get("walletStatus"), parsedStatus));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (keyword != null && !keyword.isBlank()) {
                String normalizedKeyword = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
                Join<Wallet, User> userJoin = root.join("user", JoinType.LEFT);
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(userJoin.get("userName")), normalizedKeyword),
                        cb.like(cb.lower(userJoin.get("email")), normalizedKeyword)
                ));
            }

            return predicate;
        };
    }

    private Specification<WalletTransaction> buildTransactionSpecification(
            String type,
            String status,
            LocalDateTime from,
            LocalDateTime to,
            String keyword,
            UUID userId,
            UUID walletId
    ) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            predicate = cb.and(predicate, cb.between(root.get("createdAt"), from, to));

            if (walletId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("wallet").get("walletId"), walletId));
            }

            if (userId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("wallet").get("user").get("userId"), userId));
            }

            if (type != null && !type.isBlank()) {
                try {
                    WalletTxType parsedType = WalletTxType.valueOf(type.trim().toUpperCase(Locale.ROOT));
                    predicate = cb.and(predicate, cb.equal(root.get("type"), parsedType));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (status != null && !status.isBlank()) {
                try {
                    WalletTxStatus parsedStatus = WalletTxStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
                    predicate = cb.and(predicate, cb.equal(root.get("status"), parsedStatus));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (keyword != null && !keyword.isBlank()) {
                String normalizedKeyword = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("description"), "")), normalizedKeyword),
                        cb.like(cb.lower(cb.coalesce(root.get("payosOrderCode"), "")), normalizedKeyword)
                ));
            }

            return predicate;
        };
    }

    private AdminWalletItemResponse toAdminWalletItem(Wallet wallet) {
        User user = wallet.getUser();
        return AdminWalletItemResponse.builder()
                .walletId(wallet.getWalletId())
                .userId(user.getUserId())
                .userName(user.getUserName())
                .userEmail(user.getEmail())
                .balance(wallet.getBalance())
                .frozenAmount(wallet.getFrozenAmount())
                .walletStatus(wallet.getWalletStatus())
                .frozenReason(wallet.getFrozenReason())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private AdminWalletTransactionItemResponse toAdminTransactionItem(WalletTransaction tx) {
        Wallet wallet = tx.getWallet();
        User user = wallet.getUser();
        return AdminWalletTransactionItemResponse.builder()
                .transactionId(tx.getWalletTransactionId())
                .walletId(wallet.getWalletId())
                .userId(user.getUserId())
                .userName(user.getUserName())
                .userEmail(user.getEmail())
                .type(tx.getType())
                .status(tx.getStatus())
                .amount(tx.getAmount())
                .balanceBefore(tx.getBalanceBefore())
                .balanceAfter(tx.getBalanceAfter())
                .description(tx.getDescription())
                .payosOrderCode(tx.getPayosOrderCode())
                .withdrawRequestId(tx.getWithdrawRequestId())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private LocalDateTime parseDateOrDefault(String value, LocalDateTime defaultValue, boolean endOfDayForDateOnly) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e) {
            try {
                LocalDate date = LocalDate.parse(value);
                return endOfDayForDateOnly
                        ? date.plusDays(1).atStartOfDay().minusNanos(1)
                        : date.atStartOfDay();
            } catch (DateTimeParseException ignored) {
                return defaultValue;
            }
        }
    }

    private long toLong(Object[] source, int index) {
        if (source == null || index >= source.length || source[index] == null) {
            return 0L;
        }
        return ((Number) source[index]).longValue();
    }
}

