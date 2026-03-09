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
    FORBIDDEN(1002, "You do not have permission", HttpStatus.FORBIDDEN), // alias for clarity
    REFRESH_TOKEN_NOT_FOUND(1003, "Refresh token not found", HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REVOKED(1004, "Refresh token has been revoked", HttpStatus.FORBIDDEN),
    INVALID_TOKEN_TYPE(1005, "Invalid token type", HttpStatus.BAD_REQUEST),
    LOGOUT_FAILED(1006, "Logout failed", HttpStatus.INTERNAL_SERVER_ERROR),
    REFRESH_TOKEN_EXPIRED(1007, "Refresh token expired", HttpStatus.UNAUTHORIZED),
    SOCIAL_ACCOUNT_REQUIRED(1008, "Social account required", HttpStatus.BAD_REQUEST),

    //User
    USER_EXISTED(2001,"Email existed", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(2002,"User not found", HttpStatus.NOT_FOUND),
    USER_NOT_AUTHENTICATED(2003,"User not authenticated", HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_FOUND(2004,"Email not found", HttpStatus.NOT_FOUND),

    //Role
    ROLE_NOT_FOUND(3001,"Role not found", HttpStatus.NOT_FOUND),

    //ClassRoom
    CLASS_NOT_FOUND(4001,"Class not found", HttpStatus.NOT_FOUND),

    //Course
    COURSE_NOT_FOUND(4002,"Course not found", HttpStatus.NOT_FOUND),
    FILE_NOT_FOUND(4003,"File not found in course", HttpStatus.NOT_FOUND),
    FILE_DOWNLOAD_ERROR(4004,"Error downloading file", HttpStatus.INTERNAL_SERVER_ERROR),

    //Post
    POST_NOT_FOUND(5001,"Post not found", HttpStatus.NOT_FOUND),
    COMMENT_NOT_FOUND(5002, "Comment not found", HttpStatus.NOT_FOUND),

    //Review
    REVIEW_NOT_FOUND(6001, "Review not found", HttpStatus.NOT_FOUND),

    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR), // Lỗi 500 không xác định
    INVALID_KEY(8888, "Invalid message key", HttpStatus.BAD_REQUEST), // Lỗi validate chung
    ;



    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }
}
