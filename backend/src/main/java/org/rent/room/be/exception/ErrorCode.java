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
    SOCIAL_ACCOUNT_REQUIRED(1008, "Social account required", HttpStatus.BAD_REQUEST),

    //User
    USER_EXISTED(2001,"Email existed", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(2002,"User not found", HttpStatus.NOT_FOUND),
    USER_NOT_AUTHENTICATED(2003,"User not authenticated", HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_FOUND(2004,"Email not found", HttpStatus.NOT_FOUND),

    //ClassRoom
    CLASS_NOT_FOUND(4001,"Class not found", HttpStatus.NOT_FOUND),

    //Course
    COURSE_NOT_FOUND(4002,"Course not found", HttpStatus.NOT_FOUND),
    FILE_NOT_FOUND(4003,"File not found in course", HttpStatus.NOT_FOUND),
    FILE_DOWNLOAD_ERROR(4004,"Error downloading file", HttpStatus.INTERNAL_SERVER_ERROR),

    //Assignment
    ASSIGNMENT_NOT_FOUND(7001, "Assignment not found", HttpStatus.NOT_FOUND),
    ASSIGNMENT_FORBIDDEN(7002, "You do not have permission for this assignment", HttpStatus.FORBIDDEN),
    ASSIGNMENT_QUESTION_INVALID(7003, "Assignment question is invalid", HttpStatus.BAD_REQUEST),
    ASSIGNMENT_QUESTION_NOT_FOUND(7004, "Assignment question not found", HttpStatus.NOT_FOUND),
    ASSIGNMENT_NOT_ACTIVE(7005, "Assignment is not active", HttpStatus.BAD_REQUEST),
    ASSIGNMENT_DEADLINE_EXCEEDED(7006, "Assignment deadline has passed", HttpStatus.BAD_REQUEST),
    ASSIGNMENT_PASSWORD_INVALID(7007, "Assignment password is invalid", HttpStatus.BAD_REQUEST),
    ASSIGNMENT_TIME_LIMIT_INVALID(7008, "Assignment time limit is invalid", HttpStatus.BAD_REQUEST),

    //Submission
    SUBMISSION_NOT_FOUND(7101, "Submission not found", HttpStatus.NOT_FOUND),
    SUBMISSION_ALREADY_EXISTS(7102, "Submission already exists", HttpStatus.BAD_REQUEST),
    SUBMISSION_FORBIDDEN(7103, "You do not have permission for this submission", HttpStatus.FORBIDDEN),
    SUBMISSION_ANSWERS_INCOMPLETE(7104, "Submission answers are incomplete", HttpStatus.BAD_REQUEST),
    SUBMISSION_ANSWER_INVALID(7105, "Submission answer is invalid", HttpStatus.BAD_REQUEST),
    SUBMISSION_ANSWER_NOT_FOUND(7106, "Submission answer not found", HttpStatus.NOT_FOUND),
    SUBMISSION_GRADE_INVALID(7107, "Submission grade is invalid", HttpStatus.BAD_REQUEST),
    SUBMISSION_ATTEMPT_LIMIT_EXCEEDED(7108, "Submission attempt limit exceeded", HttpStatus.BAD_REQUEST),
    SUBMISSION_ATTEMPT_STARTED_AT_REQUIRED(7109, "Submission attempt start time is required", HttpStatus.BAD_REQUEST),
    SUBMISSION_TIME_LIMIT_EXCEEDED(7110, "Submission time limit exceeded", HttpStatus.BAD_REQUEST),

    //Audio
    AUDIO_FILE_NOT_FOUND(7201, "Audio file not found", HttpStatus.NOT_FOUND),

    //Post
    POST_NOT_FOUND(5001,"Post not found", HttpStatus.NOT_FOUND),

    //Role
    ROLE_NOT_FOUND(3001,"Role not found", HttpStatus.NOT_FOUND),

    //Wallet
    WALLET_NOT_FOUND(6001,"Người dùng chưa tạo ví cá nhân", HttpStatus.NOT_FOUND),

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
