package org.rent.room.be.service;

import org.rent.room.be.dto.response.audio.AssignmentAudioResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface AssignmentAudioService {

    AssignmentAudioResponse uploadAudio(MultipartFile file) throws IOException;
}

