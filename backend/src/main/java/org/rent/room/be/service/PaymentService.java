package org.rent.room.be.service;

import org.rent.room.be.dto.request.payment.CheckoutRequest;
import org.rent.room.be.dto.response.payment.CheckoutResponse;

import java.util.Map;

public interface PaymentService {
    CheckoutResponse checkout(CheckoutRequest checkoutRequest);

    Map<String, Object> handlePayOsWebhook(Map<String, Object> payload);

    CheckoutResponse handleCheckoutResult(String orderCode, String status);
}

