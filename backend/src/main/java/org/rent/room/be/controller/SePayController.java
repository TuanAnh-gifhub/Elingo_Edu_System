package org.rent.room.be.controller;

import org.rent.room.be.base.ApiResponse;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class SePayController {
     //https://qr.sepay.vn/img?acc=SO_TAI_KHOAN&bank=NGAN_HANG&amount=SO_TIEN&des=NOI_DUNG&template=TEMPLATE&download=DOWNLOAD
    //nhúng QR trên vào Frontend để khách hàng quét
    //QR code trên thì chưa làm cho web tự động update trạng thái thanh toán

    @PostMapping("/sepay/webhook")
     public ApiResponse<?> handleSePayWebhook(Map<String, Object> payload) {

        if(payload.get("status").equals("success")){
            //update DB nha Quang
        }
        return ApiResponse.builder().build();

    }
}
