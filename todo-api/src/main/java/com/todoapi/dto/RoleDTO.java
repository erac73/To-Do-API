package com.todoapi.dto;

import com.todoapi.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class RoleDTO {

    public record RoleRequest(
            @NotBlank(message = "El nombre del rol no puede estar vacío")
            @Size(max = 50, message = "El nombre no puede superar 50 caracteres")
            String name,

            @Size(max = 200, message = "La descripción no puede superar 200 caracteres")
            String description
    ) {}

    public record RoleResponse(
            Long id,
            String name,
            String description,
            boolean active,
            int taskCount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static RoleResponse from(Role role) {
            return new RoleResponse(
                    role.getId(),
                    role.getName(),
                    role.getDescription(),
                    role.isActive(),
                    role.getTasks().size(),
                    role.getCreatedAt(),
                    role.getUpdatedAt()
            );
        }
    }
}
