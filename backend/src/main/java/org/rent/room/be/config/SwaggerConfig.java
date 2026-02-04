package org.rent.room.be.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.tags.Tags;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

import io.swagger.v3.oas.annotations.tags.Tag;
// truy cập http://localhost:8080/api/v1/rent-room/swagger-ui/index.html để xem tài liệu API

@OpenAPIDefinition(
        tags = {
                @Tag(name = "1. Authentication", description = "API quản lý xác thực"),
                @Tag(name = "2. User", description = "API quản lý người dùng"),
                @Tag(name = "3. Role", description = "API quản lý vai trò người dùng"),
                @Tag(name = "4. Rental Area", description = "API quản lý gói tòa nhà"),
                @Tag(name = "5. Room", description = "API quản lý gói thuê"),
                @Tag(name = "6. Package", description = "API quản lý gói thuê"),
                @Tag(name = "7. Report", description = "API quản lý báo cáo vi phạm"),
        }
)


@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Hệ thống Quản lý Cho Thuê Phòng Học")
                        .version("1.0")
                        .description("Tài liệu API cho hệ thống quản lý cho thuê phòng học.")
                        .license(new License().name("API License").url("http://domain.com/license")))
                .servers(List.of(
                        new Server().url("/api/v1/rent-room").description("Local Server URL") ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
