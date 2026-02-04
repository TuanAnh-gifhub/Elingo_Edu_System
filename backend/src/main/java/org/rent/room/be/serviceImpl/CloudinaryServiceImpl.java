package org.rent.room.be.serviceImpl;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.dto.internal.CloudinaryUploadResult;
import org.rent.room.be.service.CloudinaryService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CloudinaryServiceImpl implements CloudinaryService {

    Cloudinary cloudinary;

    @Override
    public CloudinaryUploadResult uploadImage(MultipartFile file, String folder) {
        validateImage(file);

        try {
            Map<String, Object> options = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "use_filename", true,
                    "unique_filename", true
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> res = cloudinary.uploader().upload(file.getBytes(), options);

            return CloudinaryUploadResult.builder()
                    .url((String) res.get("secure_url"))
                    .publicId((String) res.get("public_id"))
                    .format((String) res.get("format"))
                    .bytes(((Number) res.get("bytes")).longValue())
                    .build();

        } catch (IOException e) {
            throw new RuntimeException("Upload image to Cloudinary failed", e);
        }
    }

    @Override
    public List<CloudinaryUploadResult> uploadImages(List<MultipartFile> files, String folder) {
        if (files == null || files.isEmpty()) return Collections.emptyList();
        List<CloudinaryUploadResult> results = new ArrayList<>();
        for (MultipartFile f : files) {
            if (f == null || f.isEmpty()) continue;
            results.add(uploadImage(f, folder));
        }
        return results;
    }

    @Override
    public boolean deleteByPublicId(String publicId) {
        if (publicId == null || publicId.isBlank()) return false;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> res = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
                    "resource_type", "image",
                    "invalidate", true
            ));
            return "ok".equalsIgnoreCase((String) res.get("result"));
        } catch (IOException e) {
            throw new RuntimeException("Delete image from Cloudinary failed", e);
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Image file is empty");
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/")) throw new IllegalArgumentException("Only image files are allowed");
        long maxBytes = 5 * 1024 * 1024;
        if (file.getSize() > maxBytes) throw new IllegalArgumentException("Max image size is 5MB");
    }
}



