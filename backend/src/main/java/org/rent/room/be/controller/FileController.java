package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.response.file.UploadResponse;
import org.rent.room.be.service.FileStorageService;
import org.rent.room.be.service.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping({"/files", "/api/v1/files"})
@Tag(name = "8. File")
@Slf4j
public class FileController {

    private static final Pattern CLOUDINARY_MAX_PATTERN = Pattern.compile("Maximum is (\\d+)");

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UploadService uploadService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);
        return ResponseEntity.ok(fileName);
    }

    @PostMapping("/cloudinary")
    public ResponseEntity<ApiResponse<?>> uploadToCloudinary(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            Map<?, ?> uploadResult = uploadService.uploadImage(file);
            UploadResponse response = UploadResponse.builder()
                .url(String.valueOf(uploadResult.get("secure_url")))
                .originalFilename(file.getOriginalFilename())
                .resourceType(String.valueOf(uploadResult.get("resource_type")))
                .publicId(String.valueOf(uploadResult.get("public_id")))
                .format((String) uploadResult.get("format"))
                .width(uploadResult.get("width") instanceof Number
                    ? ((Number) uploadResult.get("width")).intValue()
                    : null)
                .height(uploadResult.get("height") instanceof Number
                    ? ((Number) uploadResult.get("height")).intValue()
                    : null)
                .bytes(uploadResult.get("bytes") instanceof Number
                    ? ((Number) uploadResult.get("bytes")).longValue()
                    : null)
                .duration(uploadResult.get("duration") instanceof Number
                    ? ((Number) uploadResult.get("duration")).doubleValue()
                    : null)
                .build();

            return ResponseEntity.ok(
                ApiResponse.<UploadResponse>builder()
                    .code(200)
                    .message("Upload file successfully")
                    .result(response)
                    .build()
            );
        } catch (Exception e) {
            String requestId = UUID.randomUUID().toString();
            String rootCauseMessage = resolveRootCauseMessage(e);
            int statusCode = resolveStatusCode(rootCauseMessage);
            String userMessage = resolveUserMessage(rootCauseMessage, statusCode);
            String userHint = resolveHint(rootCauseMessage, statusCode);

            log.error("[{}] Upload Cloudinary failed. Root cause: {}", requestId, rootCauseMessage, e);

            Map<String, String> errorDetail = new LinkedHashMap<>();
            errorDetail.put("requestId", requestId);
            errorDetail.put("detail", rootCauseMessage);
            errorDetail.put("hint", userHint);

            return ResponseEntity.status(statusCode).body(
                ApiResponse.<Map<String, String>>builder()
                    .code(statusCode)
                    .message(userMessage + " (ma loi: " + requestId + ")")
                    .result(errorDetail)
                    .build()
            );
        }
    }

    private int resolveStatusCode(String rootCauseMessage) {
        if (rootCauseMessage == null || rootCauseMessage.isBlank()) {
            return HttpStatus.INTERNAL_SERVER_ERROR.value();
        }

        String normalized = rootCauseMessage.toLowerCase();

        if (normalized.contains("file size too large")) {
            return HttpStatus.PAYLOAD_TOO_LARGE.value();
        }

        if (normalized.contains("invalid api key") || normalized.contains("must supply api_key")
                || normalized.contains("invalid signature")) {
            return HttpStatus.UNAUTHORIZED.value();
        }

        return HttpStatus.INTERNAL_SERVER_ERROR.value();
    }

    private String resolveUserMessage(String rootCauseMessage, int statusCode) {
        if (statusCode == HttpStatus.PAYLOAD_TOO_LARGE.value()) {
            String maxBytes = extractCloudinaryMaxBytes(rootCauseMessage);
            if (maxBytes != null) {
                return "File vượt quá giới hạn Cloudinary hiện tại (toi da " + formatBytesToMb(maxBytes) + ").";
            }
            return "File vượt quá giới hạn dung lượng upload của Cloudinary.";
        }

        if (statusCode == HttpStatus.UNAUTHORIZED.value()) {
            return "Cloudinary từ chối xác thực. Vui lòng kiểm tra cấu hình api key/secret.";
        }

        return "Upload Cloudinary thất bại. " + rootCauseMessage;
    }

    private String resolveHint(String rootCauseMessage, int statusCode) {
        if (statusCode == HttpStatus.PAYLOAD_TOO_LARGE.value()) {
            return "Giảm kích thước file, chia nhỏ file, hoặc nâng gói Cloudinary để tăng giới hạn upload.";
        }

        if (statusCode == HttpStatus.UNAUTHORIZED.value()) {
            return "Kiem tra CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET trong env backend.";
        }

        return "Kiem tra cau hinh Cloudinary va ket noi mang cua backend.";
    }

    private String extractCloudinaryMaxBytes(String rootCauseMessage) {
        if (rootCauseMessage == null) {
            return null;
        }

        Matcher matcher = CLOUDINARY_MAX_PATTERN.matcher(rootCauseMessage);
        if (!matcher.find()) {
            return null;
        }

        return matcher.group(1);
    }

    private String formatBytesToMb(String bytesText) {
        try {
            long bytes = Long.parseLong(bytesText);
            long mb = Math.max(1L, Math.round(bytes / (1024.0 * 1024.0)));
            return mb + "MB";
        } catch (NumberFormatException ignored) {
            return bytesText + " bytes";
        }
    }

    private String resolveRootCauseMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }

        String message = current.getMessage();
        if (message == null || message.isBlank()) {
            message = throwable.getMessage();
        }

        if (message == null || message.isBlank()) {
            return current.getClass().getSimpleName();
        }

        return message;
    }
}

