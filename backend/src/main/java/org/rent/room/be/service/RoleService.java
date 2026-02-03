package org.rent.room.be.service;

import org.rent.room.be.entity.Role;

import java.util.List;

public interface RoleService {
    List<Role> getAllActiveRoles();

    Role getRoleById(Long id);

    Role createRole(Role role);

    Role updateRole(Long id, Role role);

    void softDeleteRole(Long id);
}