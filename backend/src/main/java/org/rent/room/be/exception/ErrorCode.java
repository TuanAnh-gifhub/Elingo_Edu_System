package org.rent.room.be.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    // AUTHENTICATION
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

    // User
    USER_EXISTED(2001, "Email existed", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(2002, "User not found", HttpStatus.NOT_FOUND),
    USER_NOT_AUTHENTICATED(2003, "User not authenticated", HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_FOUND(2004, "Email not found", HttpStatus.NOT_FOUND),
    EMAIL_NOT_VERIFIED(2005, "Email is not verified", HttpStatus.FORBIDDEN),

    // ClassRoom
    CLASS_NOT_FOUND(4001, "Class not found", HttpStatus.NOT_FOUND),
    CLASS_FULL(4005, "Class is full", HttpStatus.BAD_REQUEST),
    CLASS_INACTIVE(4006, "Class is not active", HttpStatus.BAD_REQUEST),
    STUDENT_ALREADY_ENROLLED(4007, "Student already enrolled in this class", HttpStatus.BAD_REQUEST),
    CLASS_SELF_ENROLL_NOT_ALLOWED(4008, "Teacher cannot enroll own class", HttpStatus.BAD_REQUEST),
    CLASS_ONLINE_NOT_OPEN(4009, "Lớp học trực tuyến chưa được giáo viên mở", HttpStatus.FORBIDDEN),
    CLASS_WALLET_EMPTY(4010, "Ví lớp hiện không có tiền để nhận", HttpStatus.BAD_REQUEST),
    CLASS_WALLET_CLAIM_NOT_AVAILABLE(4011, "Chỉ nhận tiền sau khi lớp học đã kết thúc", HttpStatus.BAD_REQUEST),

    // Course
    COURSE_NOT_FOUND(4002, "Course not found", HttpStatus.NOT_FOUND),
    FILE_NOT_FOUND(4003, "File not found in course", HttpStatus.NOT_FOUND),
    FILE_DOWNLOAD_ERROR(4004, "Error downloading file", HttpStatus.INTERNAL_SERVER_ERROR),

    // Post
    POST_NOT_FOUND(5001, "Post not found", HttpStatus.NOT_FOUND),
    COMMENT_NOT_FOUND(5002, "Comment not found", HttpStatus.NOT_FOUND),

    // Review
    REVIEW_NOT_FOUND(6001, "Review not found", HttpStatus.NOT_FOUND),
    // Quiz
    QUIZ_NOT_FOUND(6001, "Quiz not found", HttpStatus.NOT_FOUND),
    INVALID_EXCEL_FORMAT(6003, "Invalid Excel format", HttpStatus.BAD_REQUEST),
    EXCEL_IMPORT_ERROR(6004, "Excel import error", HttpStatus.BAD_REQUEST),
    QUIZ_ACCESS_DENIED(6005, "You are not enrolled in this class or cannot access this quiz", HttpStatus.FORBIDDEN),
    INVALID_QUIZ_SUBMISSION(6006, "Invalid quiz submission: wrong question count, duplicate ids, or invalid option ids",
            HttpStatus.BAD_REQUEST),
    QUIZ_ATTEMPTS_EXHAUSTED(6007, "Bạn đã sử dụng hết số làn làm bài của mình", HttpStatus.BAD_REQUEST),
    QUIZ_INVALID_MAX_ATTEMPTS(6008, "maxAttempts must be at least 1", HttpStatus.BAD_REQUEST),
    QUIZ_ATTEMPT_NOT_FOUND(6009, "Quiz attempt not found", HttpStatus.NOT_FOUND),
    QUIZ_CLOSED(6010, "Quiz hiện đang khóa, giáo viên chưa mở bài", HttpStatus.FORBIDDEN),
    QUIZ_INVALID_DURATION(6011, "Thời gian làm bài phải từ 1 đến 300 phút", HttpStatus.BAD_REQUEST),

    // Question
    QUESTION_NOT_FOUND(6101, "Question not found", HttpStatus.NOT_FOUND),

    // QuestionOption
    QUESTION_OPTION_NOT_FOUND(6201, "Question option not found", HttpStatus.NOT_FOUND),

    // Role
    ROLE_NOT_FOUND(3001, "Role not found", HttpStatus.NOT_FOUND),

    // Teacher verification
    TEACHER_VERIFICATION_NOT_FOUND(3101, "Teacher verification request not found", HttpStatus.NOT_FOUND),
    TEACHER_VERIFICATION_ALREADY_PENDING(3102, "You already have a pending teacher verification request", HttpStatus.BAD_REQUEST),
    TEACHER_VERIFICATION_ALREADY_APPROVED(3103, "Your account is already approved as teacher", HttpStatus.BAD_REQUEST),
    INVALID_CERTIFICATE_FILE(3104, "Only image and PDF certificate files are allowed", HttpStatus.BAD_REQUEST),
    CERTIFICATE_FILE_TOO_LARGE(3105, "Certificate file exceeds maximum size", HttpStatus.BAD_REQUEST),
    CERTIFICATE_REQUIRED(3106, "At least one certificate file is required", HttpStatus.BAD_REQUEST),

    //Wallet
    WALLET_NOT_FOUND(7001,"Người dùng chưa tạo ví cá nhân", HttpStatus.NOT_FOUND),
    WALLET_LOCKED(7002, "Ví của bạn đang bị khóa", HttpStatus.BAD_REQUEST),
    WALLET_INSUFFICIENT_BALANCE(7003, "Số dư ví không đủ", HttpStatus.BAD_REQUEST),

    // Subscription
    SUBSCRIPTION_PACKAGE_NOT_FOUND(7101, "Không tìm thấy gói đăng ký", HttpStatus.NOT_FOUND),
    SUBSCRIPTION_PACKAGE_INACTIVE(7102, "Gói đăng ký này không còn hoạt động", HttpStatus.BAD_REQUEST),
    SUBSCRIPTION_ALREADY_ACTIVE(7103, "Bạn đang sử dụng gói này. Vui lòng chờ hết hạn để mua lại", HttpStatus.BAD_REQUEST),

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
