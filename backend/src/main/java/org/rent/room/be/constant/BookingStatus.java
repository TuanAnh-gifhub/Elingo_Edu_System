package org.rent.room.be.constant;

public enum BookingStatus {
    PENDING,    // Chờ chủ trọ xác nhận
    CONFIRMED,  // Chủ trọ đã đồng ý
    REJECTED,   // Chủ trọ từ chối
    COMPLETED,  // Đã check-out / hoàn tất
    CANCELLED   // Khách hủy
}