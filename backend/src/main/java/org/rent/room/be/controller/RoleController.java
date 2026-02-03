package org.rent.room.be.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.rent.room.be.base.ApiResponse;
import org.rent.room.be.entity.Role;
import org.rent.room.be.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@Tag(name = "3. Role")
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Role>>> getAllRoles() {
        return ResponseEntity.ok(
                ApiResponse.<List<Role>>builder()
                        .code(200)
                        .message("Get all active roles successfully")
                        .result(roleService.getAllActiveRoles())
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Role>> getRoleById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.<Role>builder()
                        .code(200)
                        .message("Get role detail successfully")
                        .result(roleService.getRoleById(id))
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Role>> createRole(@RequestBody  Role role) {
        return ResponseEntity.ok(
                ApiResponse.<Role>builder()
                        .code(200)
                        .message("Role created successfully")
                        .result(roleService.createRole(role))
                        .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Role>> updateRole(@PathVariable Long id, @RequestBody Role role) {
        return ResponseEntity.ok(
                ApiResponse.<Role>builder()
                        .code(200)
                        .message("Role updated successfully")
                        .result(roleService.updateRole(id, role))
                        .build()
        );
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable Long id) {
        roleService.softDeleteRole(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Role has been deactivated successfully")
                        .build()
        );
    }
}