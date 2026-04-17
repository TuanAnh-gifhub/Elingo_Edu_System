package org.rent.room.be.service;

import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.WithdrawStatus;
import org.rent.room.be.dto.request.wallet.CreateWithdrawRequest;
import org.rent.room.be.dto.response.wallet.AdminWithdrawRequestItemResponse;
import org.rent.room.be.dto.response.wallet.WithdrawRequestItemResponse;

import java.util.UUID;

public interface WalletWithdrawService {

    WithdrawRequestItemResponse createWithdrawRequest(CreateWithdrawRequest request);

    PageResponse<WithdrawRequestItemResponse> getMyWithdrawRequests(int page, int limit, WithdrawStatus status);

    PageResponse<AdminWithdrawRequestItemResponse> getAllWithdrawRequests(int page, int limit, WithdrawStatus status, UUID userId);

    void approveWithdrawRequest(UUID withdrawRequestId);

    void rejectWithdrawRequest(UUID withdrawRequestId, String adminNote);
}

