package org.rent.room.be.service;

import org.rent.room.be.dto.request.wallet.CreateDepositLinkRequest;
import org.rent.room.be.dto.response.wallet.DepositLinkResponse;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public interface WalletDepositService {

    DepositLinkResponse createDepositLink(CreateDepositLinkRequest request);

    ResponseEntity<Map<String, Object>> handlePayOsWebhook(Map<String, Object> payload);

    void handleDepositResult(String orderCode, String status);
}

