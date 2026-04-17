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
// truy cập http://localhost:8080/api/v1/elingo_edu/swagger-ui/index.html để xem tài liệu API

@OpenAPIDefinition(
        tags = {
                @Tag(name = "1. Authentication", description = "API quản lý xác thực"),
                @Tag(name = "2. User", description = "API quản lý người dùng"),
                @Tag(name = "3. ClassRoom", description = "API quản lý lớp học"),
                @Tag(name = "4. Course", description = "API quản lý khoá học"),
                @Tag(name = "5. Post", description = "API quản lý bài đăng"),
                @Tag(name = "6. Wallet", description = "API quản lý ví"),
                @Tag(name = "7. Payment", description = "API quản lý thanh toán"),
                @Tag(name = "8. Chat", description = "API quản lý chat"),
        }
)


@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Hệ thống Quản lý và Kết nối Học Tập")
                        .version("1.0")
                        .description("Tài liệu API cho hệ thống quản lý và kết nối học tập.")
                        .license(new License().name("API License").url("http://domain.com/license")))
                .servers(List.of(
                        new Server().url("/api/v1/elingo_edu").description("Local Server URL") ))
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
