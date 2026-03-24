package org.rent.room.be.serviceImpl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.constant.BookingIntentStatus;
import org.rent.room.be.constant.PaymentMethod;
import org.rent.room.be.constant.PaymentStatus;
import org.rent.room.be.constant.WalletStatus;
import org.rent.room.be.constant.WalletTxStatus;
import org.rent.room.be.constant.WalletTxType;
import org.rent.room.be.dto.request.payment.CheckoutRequest;
import org.rent.room.be.dto.response.booking.BookingResponse;
import org.rent.room.be.dto.response.payment.CheckoutResponse;
import org.rent.room.be.entity.BookingIntent;
import org.rent.room.be.entity.Payment;
import org.rent.room.be.entity.User;
import org.rent.room.be.entity.Wallet;
import org.rent.room.be.entity.WalletTransaction;
import org.rent.room.be.properties.PayOsProperties;
import org.rent.room.be.repository.BookingIntentRepository;
import org.rent.room.be.repository.PaymentRepository;
import org.rent.room.be.repository.WalletRepository;
import org.rent.room.be.repository.WalletTransactionRepository;
import org.rent.room.be.service.BookingService;
import org.rent.room.be.service.PaymentService;
import org.rent.room.be.service.UserService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {
    private final BookingService bookingService;
    private final BookingIntentRepository bookingIntentRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserService userService;
    private final PayOsProperties payOsProperties;
    private final ObjectProvider<PayOS> payOSProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public CheckoutResponse checkout(CheckoutRequest checkoutRequest) {
        BookingIntent intent = bookingIntentRepository
                .findById(checkoutRequest.getBookingIntentId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking intent"));

        User currentUser = userService.getCurrentUserEntity();
        validateIntentOwnership(intent, currentUser);
        validateIntentState(intent);

        PaymentMethod method = checkoutRequest.getPaymentMethod();
        if (method == PaymentMethod.WALLET) {
            return handleWalletCheckout(intent, currentUser);
        }
        if (method == PaymentMethod.BANK_TRANSFER || method == PaymentMethod.VN_PAY) {
            return handlePayOsCheckout(intent, currentUser, method);
        }
        throw new RuntimeException("Phương thức thanh toán chưa được hỗ trợ");
    }

    @Override
    @Transactional
    public Map<String, Object> handlePayOsWebhook(Map<String, Object> payload) {
        try {
            WebhookData verifiedData = verifyPayOsWebhook(payload);
            if (verifiedData == null) {
                return Map.of("code", "00", "message", "signature verification failed");
            }
            Map<String, Object> data = objectMapper.convertValue(verifiedData, Map.class);
            String orderCodeValue = data.get("orderCode") == null ? "" : String.valueOf(data.get("orderCode"));
            if (orderCodeValue.isBlank()) {
                return Map.of("code", "00", "message", "orderCode missing");
            }

            long orderCode = Long.parseLong(orderCodeValue);
            Optional<Payment> optionalPayment = paymentRepository.findByPayosOrderCode(orderCode);
            if (optionalPayment.isEmpty()) {
                return Map.of("code", "00", "message", "payment not found");
            }

            Payment payment = optionalPayment.get();
            String code = String.valueOf(payload.getOrDefault("code", ""));
            if ((code == null || code.isBlank()) && data.get("code") != null) {
                code = String.valueOf(data.get("code"));
            }
            if (!"00".equals(code)) {
                if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
                    payment.setPaymentStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                }
                return Map.of("code", "00", "message", "payment failed");
            }

            finalizePaidBookingPayment(payment);
            return Map.of("code", "00", "message", "success");
        } catch (Exception e) {
            log.error("Error processing booking PAYOS webhook", e);
            return Map.of("code", "00", "message", "error");
        }
    }

    @Override
    @Transactional
    public CheckoutResponse handleCheckoutResult(String orderCode, String status) {
        if (orderCode == null || orderCode.isBlank()) {
            throw new RuntimeException("orderCode không hợp lệ");
        }
        Payment payment = paymentRepository.findByPayosOrderCode(Long.parseLong(orderCode))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy payment"));

        if (payment.getBookingId() != null && payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return CheckoutResponse.builder()
                    .mode("BOOKED")
                    .paymentStatus(PaymentStatus.SUCCESS.name())
                    .bookingId(payment.getBookingId())
                    .orderCode(orderCode)
                    .message("Đã thanh toán thành công")
                    .build();
        }

        if (isSuccessStatus(status) && payment.getPaymentStatus() == PaymentStatus.PENDING) {
            if (tryFinalizeByPayOsPaymentStatus(payment)) {
                return CheckoutResponse.builder()
                        .mode("BOOKED")
                        .paymentStatus(PaymentStatus.SUCCESS.name())
                        .bookingId(payment.getBookingId())
                        .orderCode(orderCode)
                        .message("Thanh toán thành công")
                        .build();
            }
            return CheckoutResponse.builder()
                    .mode("PENDING")
                    .paymentStatus(PaymentStatus.PENDING.name())
                    .orderCode(orderCode)
                    .message("Đang chờ webhook xác nhận thanh toán")
                    .build();
        }

        if (isFailureStatus(status) && payment.getPaymentStatus() == PaymentStatus.PENDING) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }

        return CheckoutResponse.builder()
                .mode("FAILED")
                .paymentStatus(payment.getPaymentStatus().name())
                .orderCode(orderCode)
                .message("Thanh toán chưa thành công")
                .build();
    }

    private CheckoutResponse handleWalletCheckout(BookingIntent intent, User user) {
        Wallet wallet = walletRepository.findByUser(user)
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .user(user)
                        .balance(BigDecimal.ZERO)
                        .frozenAmount(BigDecimal.ZERO)
                        .walletStatus(WalletStatus.ACTIVE)
                        .build()));

        if (wallet.getWalletStatus() == WalletStatus.LOCKED) {
            throw new RuntimeException("Ví đang bị khóa");
        }
        if (wallet.getBalance().compareTo(intent.getPreviewPrice()) < 0) {
            throw new RuntimeException("Số dư ví không đủ để thanh toán");
        }

        BigDecimal before = wallet.getBalance();
        BigDecimal after = before.subtract(intent.getPreviewPrice());
        wallet.setBalance(after);
        walletRepository.save(wallet);

        Payment payment = Payment.builder()
                .bookingIntent(intent)
                .amount(intent.getPreviewPrice())
                .paymentMethod(PaymentMethod.WALLET)
                .paymentStatus(PaymentStatus.SUCCESS)
                .transactionDate(LocalDateTime.now())
                .user(user)
                .wallet(wallet)
                .build();
        paymentRepository.save(payment);
        try {
            BookingResponse booking = bookingService.createBooking(intent.getBookingIntentId(), payment);
            intent.setStatus(BookingIntentStatus.CONFIRMED);
            bookingIntentRepository.save(intent);

            payment.setBookingId(booking.getBookingId());
            paymentRepository.save(payment);

            createWalletPaymentTransactionSafely(
                    wallet,
                    booking.getBookingId(),
                    intent.getPreviewPrice(),
                    before,
                    after,
                    "Thanh toan booking bang vi",
                    "booking_checkout_wallet"
            );

            return CheckoutResponse.builder()
                    .mode("BOOKED")
                    .paymentStatus(PaymentStatus.SUCCESS.name())
                    .bookingId(booking.getBookingId())
                    .message("Thanh toán bằng ví thành công")
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo booking cho thanh toán ví", e);
        }
    }

    private CheckoutResponse handlePayOsCheckout(BookingIntent intent, User user, PaymentMethod method) {
        PayOS payOS = requirePayOsClient();
        long orderCode = generateUniqueOrderCode();

        Payment payment = Payment.builder()
                .bookingIntent(intent)
                .amount(intent.getPreviewPrice())
                .paymentMethod(method)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now())
                .user(user)
                .payosOrderCode(orderCode)
                .build();
        paymentRepository.save(payment);

        try {
            long amount = intent.getPreviewPrice().longValue();
            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name("Thanh toan booking")
                    .quantity(1)
                    .price(amount)
                    .build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description("Booking " + intent.getBookingIntentId().toString().substring(0, 8))
                    .item(item)
                    .returnUrl(buildBookingReturnUrl(orderCode, "success"))
                    .cancelUrl(buildBookingReturnUrl(orderCode, "cancel"))
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            payment.setPayosPaymentLinkId(response.getPaymentLinkId());
            paymentRepository.save(payment);

            return CheckoutResponse.builder()
                    .mode("REDIRECT")
                    .paymentStatus(PaymentStatus.PENDING.name())
                    .paymentUrl(response.getCheckoutUrl())
                    .orderCode(String.valueOf(orderCode))
                    .message("Tạo link thanh toán thành công")
                    .build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Không thể tạo link thanh toán PAYOS", e);
        }
    }

    private void finalizePaidBookingPayment(Payment payment) {
        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS && payment.getBookingId() != null) {
            return;
        }
        if (payment.getBookingIntent().getStatus() == BookingIntentStatus.CONFIRMED && payment.getBookingId() != null) {
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(payment);
            return;
        }

        try {
            BookingResponse booking = bookingService.createBooking(payment.getBookingIntent().getBookingIntentId(), payment);
            BookingIntent intent = payment.getBookingIntent();
            intent.setStatus(BookingIntentStatus.CONFIRMED);
            bookingIntentRepository.save(intent);

            payment.setBookingId(booking.getBookingId());
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(payment);

            Wallet renterWallet = walletRepository.findByUser(payment.getUser())
                    .orElseGet(() -> walletRepository.save(Wallet.builder()
                            .user(payment.getUser())
                            .balance(BigDecimal.ZERO)
                            .frozenAmount(BigDecimal.ZERO)
                            .walletStatus(WalletStatus.ACTIVE)
                            .build()));
            BigDecimal sameBalance = renterWallet.getBalance();
            createWalletPaymentTransactionSafely(
                    renterWallet,
                    booking.getBookingId(),
                    payment.getAmount(),
                    sameBalance,
                    sameBalance,
                    "Thanh toan booking qua PayOS",
                    "booking_checkout_payos"
            );
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo booking cho thanh toán PayOS", e);
        }
    }

    private boolean tryFinalizeByPayOsPaymentStatus(Payment payment) {
        PayOS payOS = payOSProvider.getIfAvailable();
        if (payOS == null || payment.getPayosOrderCode() == null) {
            return false;
        }
        try {
            Object linkData = payOS.paymentRequests().get(payment.getPayosOrderCode());
            Map<String, Object> data = objectMapper.convertValue(linkData, Map.class);
            String status = String.valueOf(data.getOrDefault("status", ""));
            if (!"PAID".equalsIgnoreCase(status)) {
                return false;
            }
            finalizePaidBookingPayment(payment);
            return true;
        } catch (Exception e) {
            log.warn("Cannot verify PAYOS payment status from result page. orderCode={}", payment.getPayosOrderCode(), e);
            return false;
        }
    }

    private void createWalletPaymentTransactionSafely(
            Wallet wallet,
            UUID bookingId,
            BigDecimal amount,
            BigDecimal before,
            BigDecimal after,
            String description,
            String source
    ) {
        if (bookingId == null) {
            return;
        }
        if (walletTransactionRepository.existsByBookingIdAndType(bookingId, WalletTxType.BOOKING_PAYMENT)) {
            return;
        }
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTxType.BOOKING_PAYMENT)
                .status(WalletTxStatus.COMPLETED)
                .amount(amount)
                .balanceBefore(before)
                .balanceAfter(after)
                .bookingId(bookingId)
                .description(description)
                .metadata(writeMetadata(Map.of("source", source)))
                .build();
        walletTransactionRepository.save(tx);
    }

    private void validateIntentOwnership(BookingIntent intent, User currentUser) {
        if (intent.getUser() == null || !intent.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Bạn không có quyền thanh toán booking intent này");
        }
    }

    private void validateIntentState(BookingIntent intent) {
        if (intent.getExpiresAt() != null && intent.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Booking intent đã hết hạn");
        }
        if (intent.getStatus() == BookingIntentStatus.CONFIRMED) {
            throw new RuntimeException("Booking intent này đã được thanh toán");
        }
        if (intent.getStatus() == BookingIntentStatus.CANCELLED || intent.getStatus() == BookingIntentStatus.EXPIRED) {
            throw new RuntimeException("Booking intent không còn hợp lệ để thanh toán");
        }
    }

    private PayOS requirePayOsClient() {
        if (payOsProperties.getClientId() == null || payOsProperties.getClientId().isBlank()
                || payOsProperties.getApiKey() == null || payOsProperties.getApiKey().isBlank()
                || payOsProperties.getChecksumKey() == null || payOsProperties.getChecksumKey().isBlank()) {
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
            return null;
        }
        try {
            return payOS.webhooks().verify(payload);
        } catch (Exception e) {
            log.error("Error verifying booking PAYOS webhook signature", e);
            return null;
        }
    }

    private long generateUniqueOrderCode() {
        long orderCode = System.currentTimeMillis() / 1000;
        int attempts = 0;
        while (paymentRepository.findByPayosOrderCode(orderCode).isPresent()) {
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
        } catch (Exception e) {
            return null;
        }
    }

    private String buildBookingReturnUrl(long orderCode, String status) {
        String fallback = "http://localhost:5173/payment/booking-result";
        String base = payOsProperties.getReturnUrl();
        if ("cancel".equalsIgnoreCase(status)) {
            base = payOsProperties.getCancelUrl();
        }
        if (base == null || base.isBlank()) {
            return fallback + "?orderCode=" + orderCode + "&status=" + status;
        }
        try {
            URI source = URI.create(base);
            String hostBase = source.getScheme() + "://" + source.getAuthority();
            return hostBase + "/payment/booking-result?orderCode=" + orderCode + "&status=" + status;
        } catch (Exception e) {
            return fallback + "?orderCode=" + orderCode + "&status=" + status;
        }
    }

    private boolean isSuccessStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toLowerCase();
        return "success".equals(normalized) || "paid".equals(normalized) || "succeeded".equals(normalized);
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
}

