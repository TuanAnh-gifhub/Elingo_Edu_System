package org.rent.room.be.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    //AUTHENTICATION
    LOGIN_FAILED(1000, "Email or Password is invalid!", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1001, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1002, "You do not have permission", HttpStatus.FORBIDDEN),
    REFRESH_TOKEN_NOT_FOUND(1003, "Refresh token not found", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REVOKED(1004, "Refresh token has been revoked", HttpStatus.FORBIDDEN),
    INVALID_TOKEN_TYPE(1005, "Invalid token type", HttpStatus.BAD_REQUEST),
    LOGOUT_FAILED(1006, "Logout failed", HttpStatus.INTERNAL_SERVER_ERROR),
    REFRESH_TOKEN_EXPIRED(1007, "Refresh token expired", HttpStatus.UNAUTHORIZED),

    //User
    USER_EXISTED(2001,"Email existed", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(2002,"User not found", HttpStatus.NOT_FOUND),
    USER_NOT_AUTHENTICATED(2003,"User not authenticated", HttpStatus.UNAUTHORIZED),

    // Page Errors
    INVALID_PAGINATION(3001,"Invalid pagination parameters",HttpStatus.BAD_REQUEST),

    // Package Errors
    RENTPACKAGE_NOT_FOUND(4001, "Package not found", HttpStatus.NOT_FOUND),
    INVALID_RENTPACKAGE(4002, "Invalid package data", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}
