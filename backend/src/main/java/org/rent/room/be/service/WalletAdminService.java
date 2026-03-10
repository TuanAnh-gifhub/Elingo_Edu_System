package org.rent.room.be.service;

import org.rent.room.be.dto.request.wallet.UpdateWalletFreezeRequest;
import org.rent.room.be.dto.response.wallet.AdminWalletStatusResponse;

import java.util.UUID;

public interface WalletAdminService {

    AdminWalletStatusResponse updateWalletFreezeStatus(UUID userId, UpdateWalletFreezeRequest request);
}

