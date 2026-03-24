package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.rent.room.be.dto.response.audio.AssignmentAudioResponse;
import org.rent.room.be.entity.AudioFile;
import org.rent.room.be.entity.User;
import org.rent.room.be.repository.AudioFileRepository;
import org.rent.room.be.service.AssignmentAudioService;
import org.rent.room.be.service.SpeechToTextService;
import org.rent.room.be.service.UploadService;
import org.rent.room.be.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssignmentAudioServiceImpl implements AssignmentAudioService {

    private final UploadService uploadService;
    private final UserService userService;
    private final AudioFileRepository audioFileRepository;
    private final SpeechToTextService speechToTextService;

    @Override
    @Transactional
    public AssignmentAudioResponse uploadAudio(MultipartFile file) throws IOException {
        User uploader = userService.getCurrentUserEntity();

        Map<?, ?> uploadResult = uploadService.uploadImage(file);
        String audioUrl = String.valueOf(uploadResult.get("secure_url"));
        String transcript = speechToTextService.transcribe(file, audioUrl);

        Double duration = null;
        if (uploadResult.get("duration") instanceof Number number) {
            duration = number.doubleValue();
        }

        Long bytes = null;
        if (uploadResult.get("bytes") instanceof Number number) {
            bytes = number.longValue();
        }

        AudioFile audioFile = AudioFile.builder()
                .uploadedBy(uploader)
                .audioUrl(audioUrl)
                .publicId(uploadResult.get("public_id") != null ? String.valueOf(uploadResult.get("public_id")) : null)
                .resourceType(uploadResult.get("resource_type") != null ? String.valueOf(uploadResult.get("resource_type")) : null)
                .mimeType(file.getContentType())
                .durationSeconds(duration)
                .fileSizeBytes(bytes)
                .transcriptText(transcript)
                .build();

        AudioFile saved = audioFileRepository.save(audioFile);

        return AssignmentAudioResponse.builder()
                .audioFileId(saved.getAudioFileId())
                .audioUrl(saved.getAudioUrl())
                .transcriptText(saved.getTranscriptText())
                .mimeType(saved.getMimeType())
                .durationSeconds(saved.getDurationSeconds())
                .fileSizeBytes(saved.getFileSizeBytes())
                .build();
    }
}


