package org.rent.room.be.dto.response.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginGoogleResponse {
    String id;
    String email;
    @JsonProperty("verified_email")
    boolean verifiedEmail;
    String name;
    String picture;
}