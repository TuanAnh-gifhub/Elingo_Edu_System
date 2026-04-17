package org.rent.room.be.properties;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
@Component
@ConfigurationProperties(prefix = "ollama")
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OllamaProperties {
    String baseUrl = "http://localhost:11434";
    String model = "qwen2.5:7b";
    int timeoutSeconds = 60;
}
