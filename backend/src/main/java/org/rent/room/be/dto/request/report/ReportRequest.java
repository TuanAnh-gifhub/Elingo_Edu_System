package org.rent.room.be.dto.request.report;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.rent.room.be.constant.ReportStatus;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ReportRequest {
    @NotBlank(message = "Tiêu đề không bỏ trống")
    @Size(min = 5,max = 100,message = "Độ dài tiệu đề tối thiểu là 5 tối đa 100 chữ ")
    private String title;

    @NotBlank(message = "mô tả chỉ tiết không bỏ trống")
    @Size(min= 5, max = 255,message = "mô tả chỉ tiết tối thiểu là 5 tối đa là 255 chữ")
    private String content;
    @NotNull(message = "user id cần phải có")
    private UUID reportId;
    @NotBlank(message = "Địa chỉ cụ thể không bỏ trống")
    private String address;
    private String roomName;

}
