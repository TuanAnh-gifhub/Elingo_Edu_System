package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.base.PageResponse;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.constant.WithdrawStatus;
import org.rent.room.be.dto.request.wallet.CreateWithdrawRequest;
import org.rent.room.be.dto.response.wallet.AdminWithdrawRequestItemResponse;
import org.rent.room.be.dto.response.wallet.WithdrawRequestItemResponse;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WithdrawRequest;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.repository.WithdrawRequestRepository;
import org.rent.room.be.service.UserService;
import org.rent.room.be.service.WalletService;
import org.rent.room.be.service.WalletWithdrawService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletWithdrawServiceImpl implements WalletWithdrawService {

    private final WithdrawRequestRepository withdrawRequestRepository;
    private final WalletRepository walletRepository;
    private final UserService userService;
    private final WalletService walletService;

    @Override
    @Transactional
    public WithdrawRequestItemResponse createWithdrawRequest(CreateWithdrawRequest request) {
        User currentUser = userService.getCurrentUserEntity();
        Wallet wallet = walletService.getOrCreateWallet(currentUser);

        if (wallet.getWalletStatus() == WalletStatus.LOCKED) {
            throw new RuntimeException("Ví của bạn đã bị khóa");
        }

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền rút không hợp lệ");
        }

        BigDecimal available = wallet.getBalance().subtract(wallet.getFrozenAmount());
        if (available.compareTo(amount) < 0) {
            throw new RuntimeException("Số dư khả dụng không đủ để rút tiền");
        }

        wallet.setFrozenAmount(wallet.getFrozenAmount().add(amount));
        walletRepository.save(wallet);

        WithdrawRequest withdrawRequest = WithdrawRequest.builder()
                .wallet(wallet)
                .amount(amount)
                .bankCode(request.getBankCode())
                .bankAccountNumber(request.getBankAccountNumber())
                .bankAccountName(request.getBankAccountName())
                .status(WithdrawStatus.PENDING)
                .build();
        withdrawRequestRepository.save(withdrawRequest);

        return toMyWithdrawResponse(withdrawRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WithdrawRequestItemResponse> getMyWithdrawRequests(int page, int limit, WithdrawStatus status) {
        if (page < 1) {
            page = 1;
        }
        if (limit < 1) {
            limit = 20;
        }
        if (limit > 100) {
            limit = 100;
        }

        User currentUser = userService.getCurrentUserEntity();
        Wallet wallet = walletService.getOrCreateWallet(currentUser);
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<WithdrawRequest> pageData = status == null
                ? withdrawRequestRepository.findByWallet(wallet, pageable)
                : withdrawRequestRepository.findByWalletAndStatus(wallet, status, pageable);

        return PageResponse.<WithdrawRequestItemResponse>builder()
                .currentPage(pageData.getNumber() + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(pageData.getContent().stream().map(this::toMyWithdrawResponse).toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminWithdrawRequestItemResponse> getAllWithdrawRequests(int page, int limit, WithdrawStatus status, UUID userId) {
        if (page < 1) {
            page = 1;
        }
        if (limit < 1) {
            limit = 20;
        }
        if (limit > 100) {
            limit = 100;
        }

        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<WithdrawRequest> pageData;
        if (userId != null && status != null) {
            pageData = withdrawRequestRepository.findByWallet_User_UserIdAndStatus(userId, status, pageable);
        } else if (userId != null) {
            pageData = withdrawRequestRepository.findByWallet_User_UserId(userId, pageable);
        } else if (status != null) {
            pageData = withdrawRequestRepository.findByStatus(status, pageable);
        } else {
            pageData = withdrawRequestRepository.findAll(pageable);
        }

        return PageResponse.<AdminWithdrawRequestItemResponse>builder()
                .currentPage(pageData.getNumber() + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(pageData.getContent().stream().map(this::toAdminWithdrawResponse).toList())
                .build();
    }

    @Override
    @Transactional
    public void approveWithdrawRequest(UUID withdrawRequestId) {
        User admin = userService.getCurrentUserEntity();
        WithdrawRequest withdrawRequest = getPendingWithdrawRequest(withdrawRequestId);
        Wallet wallet = withdrawRequest.getWallet();

        BigDecimal amount = withdrawRequest.getAmount();
        if (wallet.getFrozenAmount().compareTo(amount) < 0) {
            throw new RuntimeException("Số dư đóng băng không đủ để duyệt rút tiền");
        }
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Số dư ví không đủ để duyệt rút tiền");
        }

        BigDecimal balanceAfter = wallet.getBalance().subtract(amount);

        wallet.setFrozenAmount(wallet.getFrozenAmount().subtract(amount));
        wallet.setBalance(balanceAfter);
        walletRepository.save(wallet);

        withdrawRequest.setStatus(WithdrawStatus.APPROVED);
        withdrawRequest.setProcessedBy(admin.getUserId());
        withdrawRequest.setProcessedAt(LocalDateTime.now());
        withdrawRequestRepository.save(withdrawRequest);
    }

    @Override
    @Transactional
    public void rejectWithdrawRequest(UUID withdrawRequestId, String adminNote) {
        User admin = userService.getCurrentUserEntity();
        WithdrawRequest withdrawRequest = getPendingWithdrawRequest(withdrawRequestId);
        Wallet wallet = withdrawRequest.getWallet();

        BigDecimal amount = withdrawRequest.getAmount();
        if (wallet.getFrozenAmount().compareTo(amount) < 0) {
            throw new RuntimeException("Số dư đóng băng không đủ để từ chối yêu cầu rút tiền");
        }

        wallet.setFrozenAmount(wallet.getFrozenAmount().subtract(amount));
        walletRepository.save(wallet);

        withdrawRequest.setStatus(WithdrawStatus.REJECTED);
        withdrawRequest.setAdminNote(adminNote);
        withdrawRequest.setProcessedBy(admin.getUserId());
        withdrawRequest.setProcessedAt(LocalDateTime.now());
        withdrawRequestRepository.save(withdrawRequest);
    }

    private WithdrawRequest getPendingWithdrawRequest(UUID withdrawRequestId) {
        WithdrawRequest withdrawRequest = withdrawRequestRepository.findById(withdrawRequestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu rút tiền"));

        if (withdrawRequest.getStatus() != WithdrawStatus.PENDING) {
            throw new RuntimeException("Yêu cầu rút tiền đã được xử lý trước đó");
        }
        return withdrawRequest;
    }

    private WithdrawRequestItemResponse toMyWithdrawResponse(WithdrawRequest withdrawRequest) {
        return WithdrawRequestItemResponse.builder()
                .withdrawRequestId(withdrawRequest.getWithdrawRequestId())
                .amount(withdrawRequest.getAmount())
                .bankCode(withdrawRequest.getBankCode())
                .bankAccountNumber(withdrawRequest.getBankAccountNumber())
                .bankAccountName(withdrawRequest.getBankAccountName())
                .status(withdrawRequest.getStatus())
                .adminNote(withdrawRequest.getAdminNote())
                .processedBy(withdrawRequest.getProcessedBy())
                .processedAt(withdrawRequest.getProcessedAt())
                .createdAt(withdrawRequest.getCreatedAt())
                .build();
    }

    private AdminWithdrawRequestItemResponse toAdminWithdrawResponse(WithdrawRequest withdrawRequest) {
        Wallet wallet = withdrawRequest.getWallet();
        User user = wallet.getUser();
        return AdminWithdrawRequestItemResponse.builder()
                .withdrawRequestId(withdrawRequest.getWithdrawRequestId())
                .walletId(wallet.getWalletId())
                .userId(user.getUserId())
                .userName(user.getUserName())
                .amount(withdrawRequest.getAmount())
                .bankCode(withdrawRequest.getBankCode())
                .bankAccountNumber(withdrawRequest.getBankAccountNumber())
                .bankAccountName(withdrawRequest.getBankAccountName())
                .status(withdrawRequest.getStatus())
                .adminNote(withdrawRequest.getAdminNote())
                .processedBy(withdrawRequest.getProcessedBy())
                .processedAt(withdrawRequest.getProcessedAt())
                .createdAt(withdrawRequest.getCreatedAt())
                .build();
    }
}

