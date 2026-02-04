package org.rent.room.be.service;


import org.rent.room.be.dto.internal.CloudinaryUploadResult;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CloudinaryService {
    CloudinaryUploadResult uploadImage(MultipartFile file, String folder);
    List<CloudinaryUploadResult> uploadImages(List<MultipartFile> files, String folder);
    boolean deleteByPublicId(String publicId);
}