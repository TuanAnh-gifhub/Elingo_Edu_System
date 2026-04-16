package org.rent.room.be.service;

import org.rent.room.be.dto.request.wallet.UpdateWalletFreezeRequest;
import org.rent.room.be.dto.request.wallet.UpdateClassWalletFeeRequest;
import org.rent.room.be.dto.response.wallet.AdminWalletStatusResponse;
import org.rent.room.be.dto.response.wallet.ClassWalletFeeConfigResponse;

import java.util.UUID;

public interface WalletAdminService {

    AdminWalletStatusResponse updateWalletFreezeStatus(UUID userId, UpdateWalletFreezeRequest request);

    ClassWalletFeeConfigResponse getClassWalletFeeConfig();

    ClassWalletFeeConfigResponse updateClassWalletFeeConfig(UpdateClassWalletFeeRequest request, UUID adminId);
}

