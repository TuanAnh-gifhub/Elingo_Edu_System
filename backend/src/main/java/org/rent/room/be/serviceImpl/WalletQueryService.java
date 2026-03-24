package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.dto.response.wallet.WalletTransactionItemResponse;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WalletTransaction;
import org.rent.room.be.repository.WalletTransactionRepository;
import org.rent.room.be.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WalletQueryService {

    private final UserService userService;
    private final WalletServiceImpl walletServiceImpl;
    private final WalletTransactionRepository walletTransactionRepository;

    @Transactional(readOnly = true)
    public PageResponse<WalletTransactionItemResponse> getMyTransactions(
            int page,
            int limit,
            String type,
            String status,
            String fromDate,
            String toDate
    ) {
        if (limit > 100) {
            limit = 100;
        }
        if (page < 1) {
            page = 1;
        }
        Pageable pageable = PageRequest.of(page - 1, limit,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        User currentUser = userService.getCurrentUserEntity();
        Wallet wallet = walletServiceImpl.getOrCreateWallet(currentUser);

        LocalDateTime from = parseDateOrDefault(fromDate, LocalDate.now().minusMonths(1).atStartOfDay());
        LocalDateTime to = parseDateOrDefault(toDate, LocalDateTime.now());

        Page<WalletTransaction> txPage =
                walletTransactionRepository.findByWalletAndCreatedAtBetween(wallet, from, to, pageable);

        List<WalletTransactionItemResponse> items = txPage.getContent().stream()
                .filter(tx -> filterByTypeAndStatus(tx, type, status))
                .map(this::toItemResponse)
                .toList();

        return PageResponse.<WalletTransactionItemResponse>builder()
                .currentPage(txPage.getNumber() + 1)
                .totalPages(txPage.getTotalPages())
                .pageSize(txPage.getSize())
                .totalElements(txPage.getTotalElements())
                .data(items)
                .build();
    }

    private WalletTransactionItemResponse toItemResponse(WalletTransaction tx) {
        return WalletTransactionItemResponse.builder()
                .transactionId(tx.getWalletTransactionId())
                .type(tx.getType())
                .status(tx.getStatus())
                .amount(tx.getAmount())
                .balanceBefore(tx.getBalanceBefore())
                .balanceAfter(tx.getBalanceAfter())
                .description(tx.getDescription())
                .payosOrderCode(tx.getPayosOrderCode())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private boolean filterByTypeAndStatus(WalletTransaction tx, String type, String status) {
        boolean matchType = true;
        boolean matchStatus = true;

        if (type != null && !type.isBlank()) {
            try {
                WalletTxType txType = WalletTxType.valueOf(type);
                matchType = tx.getType() == txType;
            } catch (IllegalArgumentException ignored) {
                matchType = true;
            }
        }

        if (status != null && !status.isBlank()) {
            try {
                WalletTxStatus txStatus = WalletTxStatus.valueOf(status);
                matchStatus = tx.getStatus() == txStatus;
            } catch (IllegalArgumentException ignored) {
                matchStatus = true;
            }
        }

        return matchType && matchStatus;
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

