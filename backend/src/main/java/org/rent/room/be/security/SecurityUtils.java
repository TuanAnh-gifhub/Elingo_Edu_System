package org.rent.room.be.security;

import org.rent.room.be.exception.AppException;
import org.rent.room.be.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static CustomUserDetails requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof CustomUserDetails details)) {
            throw new AppException(ErrorCode.USER_NOT_AUTHENTICATED);
        }
        return details;
    }
}
