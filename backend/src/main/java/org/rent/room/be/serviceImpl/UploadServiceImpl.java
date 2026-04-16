package org.rent.room.be.serviceImpl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.properties.CloudinaryProperties;
import org.rent.room.be.service.UploadService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UploadServiceImpl implements UploadService {

    private final Cloudinary cloudinary;
    private final CloudinaryProperties cloudinaryProperties;

    private String sanitizeFileName(String fileName) {
        return fileName
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-zA-Z0-9._-]", "")
                .replaceAll("-+", "-");
    }

    private String resolveResourceType(String contentType) {
        if (contentType == null) {
            return "raw";
        }

        if (contentType.startsWith("image/")) {
            return "image";
        }

        if (contentType.startsWith("video/")) {
            return "video";
        }

        // Cloudinary handles audio reliably under video resource type.
        if (contentType.startsWith("audio/")) {
            return "video";
        }

        return "raw";
    }

    private String buildReadableRawPublicId(String safeFileName) {
        String fallbackName = StringUtils.hasText(safeFileName)
                ? safeFileName
                : "file";

        int dotIndex = fallbackName.lastIndexOf('.');
        String timestamp = String.valueOf(System.currentTimeMillis());

        if (dotIndex <= 0 || dotIndex == fallbackName.length() - 1) {
            return fallbackName + "-" + timestamp;
        }

        String baseName = fallbackName.substring(0, dotIndex);
        String extension = fallbackName.substring(dotIndex + 1);
        return baseName + "-" + timestamp + "." + extension;
    }

    private String buildSignedDeliveryUrl(String resourceType, Map uploadResult) {
        Object publicIdObj = uploadResult.get("public_id");
        if (publicIdObj == null) {
            return null;
        }

        String publicId = String.valueOf(publicIdObj);
        Number version = uploadResult.get("version") instanceof Number
                ? (Number) uploadResult.get("version")
                : null;

        com.cloudinary.Url urlBuilder = cloudinary.url()
                .secure(true)
                .resourceType(resourceType)
                .type("upload")
                .signed(true);

        if (version != null) {
            urlBuilder.version(version.longValue());
        }

        return urlBuilder.generate(publicId);
    }

    @Override
    public Map uploadImage(MultipartFile file) throws IOException {
        Map<String, Object> params = new HashMap<>();
        String resourceType = resolveResourceType(file.getContentType());
        params.put("resource_type", resourceType);

        if (StringUtils.hasText(cloudinaryProperties.getFolder())) {
            params.put("folder", cloudinaryProperties.getFolder().trim());
        }

        String originalFilename = file.getOriginalFilename();
        if (StringUtils.hasText(originalFilename)) {
            String safeFileName = sanitizeFileName(originalFilename);
            params.put("filename_override", originalFilename);

            if ("raw".equals(resourceType)) {
                // Keep extension in public_id for downloadable docs (xlsx/docx/pdf)
                params.put("public_id", buildReadableRawPublicId(safeFileName));
                params.put("use_filename", false);
                params.put("unique_filename", false);
            } else {
                params.put("use_filename", true);
                params.put("unique_filename", true);
            }
        }

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);

        // Some Cloudinary accounts block public delivery for raw docs (e.g. PDF).
        // Return a signed URL so FE can open/download files reliably.
        if ("raw".equals(resourceType)) {
            String signedUrl = buildSignedDeliveryUrl(resourceType, uploadResult);
            if (StringUtils.hasText(signedUrl)) {
                uploadResult.put("secure_url", signedUrl);
            }
        }

        return uploadResult;
    }
}

