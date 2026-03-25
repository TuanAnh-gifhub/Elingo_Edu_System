package org.rent.room.be.serviceImpl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.service.UploadService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UploadServiceImpl implements UploadService {

    private final Cloudinary cloudinary;

    @Override
    public Map uploadImage(MultipartFile file) throws IOException {
        return uploadMedia(file);
    }

    @Override
    public Map uploadMedia(MultipartFile file) throws IOException {
        Map params = ObjectUtils.asMap(
                "resource_type", "auto"
        );
        try {
            return cloudinary.uploader().upload(file.getBytes(), params);
        } catch (RuntimeException ex) {
            String message = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
            if (message.contains("invalid cloud_name") || message.contains("must supply api_key")) {
                throw new AppException(ErrorCode.CLOUDINARY_CONFIG_INVALID);
            }
            throw new AppException(ErrorCode.AUDIO_UPLOAD_FAILED);
        }
    }
}

