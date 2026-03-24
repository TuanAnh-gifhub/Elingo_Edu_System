package org.rent.room.be.serviceImpl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.dto.request.wallet.CreateDepositLinkRequest;
import org.rent.room.be.dto.response.wallet.DepositLinkResponse;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WalletTransaction;
import org.rent.room.be.properties.PayOsProperties;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.repository.WalletTransactionRepository;
import org.rent.room.be.service.UserService;
import org.rent.room.be.service.WalletDepositService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletDepositServiceImpl implements WalletDepositService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserService userService;
    private final PayOsProperties payOsProperties;
    private final ObjectProvider<PayOS> payOSProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public DepositLinkResponse createDepositLink(CreateDepositLinkRequest request) {
        User currentUser = userService.getCurrentUserEntity();

        Wallet wallet = walletRepository.findByUser(currentUser)
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .user(currentUser)
                        .balance(BigDecimal.ZERO)
                        .frozenAmount(BigDecimal.ZERO)
                        .walletStatus(WalletStatus.ACTIVE)
                        .build()));

        if (wallet.getWalletStatus() == WalletStatus.LOCKED) {
            throw new RuntimeException("Ví của bạn đã bị khóa");
        }

        long amount = request.getAmount();
        long orderCode = generateUniqueOrderCode();
        PayOS payOS = requirePayOsClient();

        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTxType.DEPOSIT)
                .status(WalletTxStatus.PENDING)
                .amount(BigDecimal.valueOf(amount))
                .balanceBefore(wallet.getBalance())
                .balanceAfter(wallet.getBalance())
                .description("Nap tien vi - " + currentUser.getUserId())
                .payosOrderCode(String.valueOf(orderCode))
                .build();

        walletTransactionRepository.save(tx);

        try {
            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name("Nap tien vi")
                    .quantity(1)
                    .price(amount)
                    .build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description("Nap tien vi")
                    .item(item)
                    .returnUrl(withStatusQuery(payOsProperties.getReturnUrl(), "success"))
                    .cancelUrl(withStatusQuery(payOsProperties.getCancelUrl(), "cancel"))
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            String checkoutUrl = response.getCheckoutUrl();
            if (checkoutUrl == null || checkoutUrl.isBlank()) {
                throw new RuntimeException("PAYOS did not return checkoutUrl");
            }
            tx.setPayosPaymentLinkId(response.getPaymentLinkId());
            walletTransactionRepository.save(tx);

            return DepositLinkResponse.builder()
                    .paymentUrl(checkoutUrl)
                    .orderCode(String.valueOf(orderCode))
                    .build();
        } catch (Exception e) {
            tx.setStatus(WalletTxStatus.FAILED);
            tx.setMetadata(writeMetadata(Map.of("source", "create_link", "error", e.getMessage())));
            walletTransactionRepository.save(tx);
            log.error("Error creating PAYOS payment link. orderCode={}", orderCode, e);
            throw new RuntimeException("Không thể tạo link thanh toán PAYOS");
        }
    }

    @Override
    @Transactional
    public ResponseEntity<Map<String, Object>> handlePayOsWebhook(Map<String, Object> payload) {
        try {
            WebhookData verifiedData = verifyPayOsWebhook(payload);
            if (verifiedData == null) {
                log.warn("PAYOS webhook signature verification failed.");
                return ResponseEntity.ok(Map.of("code", "00", "message", "signature verification failed"));
            }

            Map<String, Object> data = objectMapper.convertValue(verifiedData, Map.class);
            if (data == null) {
                return ResponseEntity.ok(Map.of("code", "00", "message", "ignored"));
            }

            String code = payload.get("code") == null ? "" : String.valueOf(payload.get("code"));
            if (code.isBlank() && data.get("code") != null) {
                code = String.valueOf(data.get("code"));
            }
            String orderCode = data.get("orderCode") == null ? "" : String.valueOf(data.get("orderCode"));
            if (orderCode.isBlank()) {
                return ResponseEntity.ok(Map.of("code", "00", "message", "orderCode missing"));
            }

            Optional<WalletTransaction> optionalTx = walletTransactionRepository.findByPayosOrderCode(orderCode);
            if (optionalTx.isEmpty()) {
                return ResponseEntity.ok(Map.of("code", "00", "message", "transaction not found"));
            }

            WalletTransaction tx = optionalTx.get();
            if (tx.getStatus() == WalletTxStatus.COMPLETED) {
                return ResponseEntity.ok(Map.of("code", "00", "message", "already processed"));
            }

            Wallet wallet = tx.getWallet();

            if (!"00".equals(code)) {
                if (tx.getStatus() == WalletTxStatus.PENDING) {
                    tx.setStatus(WalletTxStatus.FAILED);
                }
                tx.setMetadata(writeMetadata(payload));
                walletTransactionRepository.save(tx);
                return ResponseEntity.ok(Map.of("code", "00", "message", "payment failed"));
            }

            if (tx.getStatus() == WalletTxStatus.PENDING) {
                BigDecimal before = wallet.getBalance();
                BigDecimal after = before.add(tx.getAmount());

                wallet.setBalance(after);
                walletRepository.save(wallet);

                tx.setBalanceBefore(before);
                tx.setBalanceAfter(after);
                tx.setStatus(WalletTxStatus.COMPLETED);
                tx.setMetadata(writeMetadata(payload));
                walletTransactionRepository.save(tx);
            }

            return ResponseEntity.ok(Map.of("code", "00", "message", "success"));

        } catch (Exception e) {
            log.error("Error processing PAYOS webhook", e);
            return ResponseEntity.ok(Map.of("code", "00", "message", "error"));
        }
    }

    @Override
    @Transactional
    public void handleDepositResult(String orderCode, String status) {
        if (orderCode == null || orderCode.isBlank()) {
            log.warn("handleDepositResult: orderCode is null or blank");
            return;
        }

        Optional<WalletTransaction> optionalTx = walletTransactionRepository.findByPayosOrderCode(orderCode);
        if (optionalTx.isEmpty()) {
            log.warn("handleDepositResult: Transaction not found for orderCode={}", orderCode);
            return;
        }

        WalletTransaction tx = optionalTx.get();

        if (tx.getStatus() == WalletTxStatus.COMPLETED) {
            log.info("handleDepositResult: Transaction already completed for orderCode={}", orderCode);
            return;
        }

        if (isSuccessStatus(status) && tx.getStatus() == WalletTxStatus.PENDING) {
            if (tryCompleteByPayOsPaymentStatus(tx)) {
                log.info("Deposit completed from return result by PAYOS status. orderCode={}", orderCode);
            } else {
                log.info("PAYOS return success received for orderCode={}, waiting webhook confirmation.", orderCode);
            }
        }

        if (isFailureStatus(status) && tx.getStatus() == WalletTxStatus.PENDING) {
            tx.setStatus(WalletTxStatus.FAILED);
        }
        tx.setMetadata(writeMetadata(new LinkedHashMap<>(Map.of(
                "source", "deposit_result_page",
                "status", status == null ? "" : status
        ))));
        walletTransactionRepository.save(tx);
    }

    private PayOS requirePayOsClient() {
        if (payOsProperties.getClientId() == null || payOsProperties.getClientId().isBlank()
                || payOsProperties.getApiKey() == null || payOsProperties.getApiKey().isBlank()
                || payOsProperties.getChecksumKey() == null || payOsProperties.getChecksumKey().isBlank()
                || payOsProperties.getReturnUrl() == null || payOsProperties.getReturnUrl().isBlank()
                || payOsProperties.getCancelUrl() == null || payOsProperties.getCancelUrl().isBlank()) {
            throw new RuntimeException("PAYOS chưa được cấu hình đầy đủ");
        }
        PayOS payOS = payOSProvider.getIfAvailable();
        if (payOS == null) {
            throw new RuntimeException("Không khởi tạo được PAYOS client");
        }
        return payOS;
    }

    private WebhookData verifyPayOsWebhook(Map<String, Object> payload) {
        PayOS payOS = payOSProvider.getIfAvailable();
        if (payOS == null) {
            log.error("PAYOS webhook received but PayOS client is not configured.");
            return null;
        }
        try {
            return payOS.webhooks().verify(payload);
        } catch (Exception e) {
            log.error("Error verifying PAYOS signature", e);
            return null;
        }
    }

    private long generateUniqueOrderCode() {
        long orderCode = System.currentTimeMillis() / 1000;
        int attempts = 0;
        while (walletTransactionRepository.findByPayosOrderCode(String.valueOf(orderCode)).isPresent()) {
            orderCode++;
            attempts++;
            if (attempts > 10_000) {
                throw new RuntimeException("Không thể sinh orderCode duy nhất cho PAYOS");
            }
        }
        return orderCode;
    }

    private String writeMetadata(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private boolean tryCompleteByPayOsPaymentStatus(WalletTransaction tx) {
        PayOS payOS = payOSProvider.getIfAvailable();
        if (payOS == null) {
            return false;
        }
        try {
            long orderCode = Long.parseLong(tx.getPayosOrderCode());
            Object paymentLink = payOS.paymentRequests().get(orderCode);
            Map<String, Object> paymentData = objectMapper.convertValue(paymentLink, Map.class);
            String paymentStatus = extractPaymentStatus(paymentData);
            if (!"PAID".equalsIgnoreCase(paymentStatus)) {
                return false;
            }
            completeDepositTransaction(tx, new LinkedHashMap<>(Map.of(
                    "source", "deposit_result_payos_query",
                    "status", paymentStatus
            )));
            return true;
        } catch (Exception e) {
            log.warn("Cannot confirm PAYOS payment status from return result. orderCode={}", tx.getPayosOrderCode(), e);
            return false;
        }
    }

    private String extractPaymentStatus(Map<String, Object> paymentData) {
        if (paymentData == null) {
            return "";
        }
        List<String> keys = new ArrayList<>(List.of("status", "paymentStatus", "payment_status"));
        for (String key : keys) {
            Object value = paymentData.get(key);
            if (value != null) {
                return String.valueOf(value);
            }
        }
        return "";
    }

    private void completeDepositTransaction(WalletTransaction tx, Map<String, Object> metadata) {
        Wallet wallet = tx.getWallet();
        BigDecimal before = wallet.getBalance();
        BigDecimal after = before.add(tx.getAmount());

        wallet.setBalance(after);
        walletRepository.save(wallet);

        tx.setBalanceBefore(before);
        tx.setBalanceAfter(after);
        tx.setStatus(WalletTxStatus.COMPLETED);
        tx.setMetadata(writeMetadata(metadata));
        walletTransactionRepository.save(tx);
    }

    private boolean isSuccessStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toLowerCase();
        return "success".equals(normalized)
                || "succes".equals(normalized)
                || "paid".equals(normalized)
                || "succeeded".equals(normalized);
    }

    private boolean isFailureStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toLowerCase();
        return "cancel".equals(normalized)
                || "cancelled".equals(normalized)
                || "canceled".equals(normalized)
                || "failed".equals(normalized)
                || "fail".equals(normalized);
    }

    private String withStatusQuery(String baseUrl, String status) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return baseUrl;
        }
        String normalized = baseUrl.trim();
        String queryPart = "status=" + status;
        if (normalized.contains("status=")) {
            return normalized;
        }
        return normalized + (normalized.contains("?") ? "&" : "?") + queryPart;
    }
}

