package org.rent.room.be.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

public interface UploadService {

    Map uploadImage(MultipartFile file) throws IOException;
}

