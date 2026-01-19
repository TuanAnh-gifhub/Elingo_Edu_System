package org.rent.room.be.config;


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


// truy cập http://localhost:8080/api/v1/rent-room/swagger-ui/index.html để xem tài liệu API
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
                                        .bearerFormat("JWT")))
                ;
    }
}
