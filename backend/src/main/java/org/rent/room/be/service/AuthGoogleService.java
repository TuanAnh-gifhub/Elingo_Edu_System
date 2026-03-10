package org.rent.room.be.service;

import org.rent.room.be.dto.response.auth.LoginGoogleResponse;

public interface AuthGoogleService {
    LoginGoogleResponse authenticate(String code);
}
