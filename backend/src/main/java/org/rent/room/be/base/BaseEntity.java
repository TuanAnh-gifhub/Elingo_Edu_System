package org.rent.room.be.base;


import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BaseEntity {
    @CreatedDate // Tự động lấy giờ hiện tại khi insert
    @Column(name = "created_at", updatable = false) // Map xuống cột created_at trong SQL
    LocalDateTime createdAt; // Sửa tên biến thành camelCase

    @LastModifiedDate // Tự động lấy giờ khi update
    @Column(name = "updated_at")
    LocalDateTime updatedAt; // Sửa tên biến thành camelCase
}
