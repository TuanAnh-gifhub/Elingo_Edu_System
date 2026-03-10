package org.rent.room.be.controller;

import jakarta.validation.Valid;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.request.payment.CheckoutRequest;
import org.rent.room.be.dto.response.payment.CheckoutResponse;
import org.rent.room.be.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    @Autowired
    private PaymentService paymentService;

    @PostMapping("/checkout")
    public ApiResponse<?> checkout(@Valid @RequestBody CheckoutRequest request) {
        try {
            return ApiResponse.builder()
                    .code(201)
                    .message("Payment Checkout successful")
                    .result(paymentService.checkout(request))
                    .build();
        } catch (Exception e) {
            return ApiResponse.builder()
                    .code(500)
                    .message(e.getMessage())
                    .build();
        }
    }

    @PostMapping("/payos/webhook")
    public ResponseEntity<Map<String, Object>> handlePayOsWebhook(
            @RequestBody Map<String, Object> payload
    ) {
        return ResponseEntity.ok(paymentService.handlePayOsWebhook(payload));
    }

    @GetMapping("/result")
    public ApiResponse<CheckoutResponse> handleResult(
            @RequestParam String orderCode,
            @RequestParam String status
    ) {
        try {
            CheckoutResponse response = paymentService.handleCheckoutResult(orderCode, status);
            return ApiResponse.<CheckoutResponse>builder()
                    .code(200)
                    .message("Handle payment result successfully")
                    .result(response)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<CheckoutResponse>builder()
                    .code(500)
                    .message(e.getMessage())
                    .build();
        }
    }
}

