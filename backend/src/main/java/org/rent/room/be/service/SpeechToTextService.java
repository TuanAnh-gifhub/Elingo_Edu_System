package org.rent.room.be.service;

import org.springframework.web.multipart.MultipartFile;

public interface SpeechToTextService {

    String transcribe(MultipartFile file, String audioUrl);
}

