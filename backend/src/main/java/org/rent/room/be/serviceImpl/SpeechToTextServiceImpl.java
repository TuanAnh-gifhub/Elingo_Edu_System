package org.rent.room.be.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.rent.room.be.service.SpeechToTextService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpeechToTextServiceImpl implements SpeechToTextService {

    private final WebClient.Builder webClientBuilder;

    @Value("${speech-to-text.endpoint:}")
    private String speechToTextEndpoint;

    @Override
    public String transcribe(MultipartFile file, String audioUrl) {
        if (speechToTextEndpoint == null || speechToTextEndpoint.isBlank()) {
            return "";
        }

        try {
            return webClientBuilder.build()
                    .post()
                    .uri(speechToTextEndpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(java.util.Map.of("audioUrl", audioUrl))
                    .retrieve()
                    .bodyToMono(String.class)
                    .blockOptional()
                    .orElse("");
        } catch (Exception ex) {
            log.warn("Speech-to-text failed for file {}: {}", file.getOriginalFilename(), ex.getMessage());
            return "";
        }
    }
}

