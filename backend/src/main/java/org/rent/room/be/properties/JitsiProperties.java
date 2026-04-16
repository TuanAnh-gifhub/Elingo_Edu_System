package org.rent.room.be.properties;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jitsi.jaas")
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JitsiProperties {

    String appId;
    String kid;
    String privateKeyPem;
    long tokenTtlSeconds = 180;
}

