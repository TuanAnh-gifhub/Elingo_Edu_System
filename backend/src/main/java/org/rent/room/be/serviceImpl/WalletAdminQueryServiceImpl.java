package org.rent.room.be.serviceImpl;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.dto.response.wallet.AdminWalletItemResponse;
import org.rent.room.be.dto.response.wallet.AdminWalletTransactionItemResponse;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.WalletTransaction;
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
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletAdminQueryServiceImpl implements WalletAdminQueryService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

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

        LocalDateTime from = parseDateOrDefault(fromDate, LocalDate.now().minusMonths(1).atStartOfDay());
        LocalDateTime to = parseDateOrDefault(toDate, LocalDateTime.now());

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

    private LocalDateTime parseDateOrDefault(String value, LocalDateTime defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e) {
            try {
                LocalDate date = LocalDate.parse(value);
                return date.atStartOfDay();
            } catch (DateTimeParseException ignored) {
                return defaultValue;
            }
        }
    }
}

