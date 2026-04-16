package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.dto.response.file.UploadResponse;
import org.rent.room.be.service.FileStorageService;
import org.rent.room.be.service.UploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping({"/files", "/api/v1/files"})
@Tag(name = "8. File")
public class FileController {

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
    public ResponseEntity<ApiResponse<UploadResponse>> uploadToCloudinary(
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.<UploadResponse>builder()
                    .code(500)
                    .message("Upload Cloudinary thất bại: " + e.getMessage())
                    .build()
            );
        }
    }
}

