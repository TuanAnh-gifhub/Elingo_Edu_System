package org.rent.room.be.security;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.rent.room.be.entity.User;
import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.rent.room.be.properties.JitsiProperties;
import org.springframework.stereotype.Service;

import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class JitsiTokenService {

    final JitsiProperties jitsiProperties;
    RSAPrivateKey cachedPrivateKey;

    public String generateJoinToken(User user, String roomName, boolean moderator) {
        if (user == null || roomName == null || roomName.isBlank()) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String appId = trim(jitsiProperties.getAppId());
        String kid = trim(jitsiProperties.getKid());
        if (appId.isEmpty() || kid.isEmpty()) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        try {
            Instant now = Instant.now();
            long ttlSeconds = Math.max(60, jitsiProperties.getTokenTtlSeconds());

            Map<String, Object> context = Map.of(
                    "user", Map.of(
                            "id", resolveUserId(user),
                            "name", safe(user.getUserName()),
                            "email", safe(user.getEmail()),
                            "moderator", String.valueOf(moderator)
                    )
            );

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .audience("jitsi")
                    .issuer("chat")
                    .subject(appId)
                    .claim("room", roomName)
                    .claim("context", context)
                    .issueTime(Date.from(now))
                    .notBeforeTime(Date.from(now.minusSeconds(5)))
                    .expirationTime(Date.from(now.plusSeconds(ttlSeconds)))
                    .build();

            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                    .type(JOSEObjectType.JWT)
                    .keyID(kid)
                    .build();

            SignedJWT signedJWT = new SignedJWT(header, claimsSet);
            signedJWT.sign(new RSASSASigner(getPrivateKey()));
            return signedJWT.serialize();
        } catch (Exception ex) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    public long getTokenTtlSeconds() {
        return Math.max(60, jitsiProperties.getTokenTtlSeconds());
    }

    private synchronized RSAPrivateKey getPrivateKey() throws Exception {
        if (cachedPrivateKey != null) {
            return cachedPrivateKey;
        }

        String pem = trim(jitsiProperties.getPrivateKeyPem());
        if (pem.isEmpty()) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String normalizedPem = pem
                .replace("\\n", "\n")
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("\r", "")
                .replace("\n", "")
                .trim();

        byte[] keyBytes = Base64.getDecoder().decode(normalizedPem);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        cachedPrivateKey = (RSAPrivateKey) keyFactory.generatePrivate(spec);
        return cachedPrivateKey;
    }

    private String resolveUserId(User user) {
        UUID userId = user.getUserId();
        return userId != null ? userId.toString() : "";
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}

