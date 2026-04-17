package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.dto.response.wallet.AdminDepositTransactionSummaryResponse;
import org.rent.room.be.dto.response.wallet.AdminWalletItemResponse;
import org.rent.room.be.dto.response.wallet.AdminWalletTransactionItemResponse;

import java.util.UUID;

public interface WalletAdminQueryService {

    PageResponse<AdminWalletItemResponse> getAllWallets(int page, int limit, String keyword, String walletStatus, UUID userId);

    PageResponse<AdminWalletTransactionItemResponse> getAllTransactions(
            int page,
            int limit,
            String type,
            String status,
            String fromDate,
            String toDate,
            String keyword,
            UUID userId,
            UUID walletId
    );

    AdminDepositTransactionSummaryResponse getAdminDepositTransactionSummary(String fromDate, String toDate);
}

