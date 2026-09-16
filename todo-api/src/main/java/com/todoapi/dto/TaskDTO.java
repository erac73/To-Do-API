package com.todoapi.dto;

import com.todoapi.model.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class TaskDTO {

    public record TaskRequest(
            @NotBlank(message = "El título no puede estar vacío")
            @Size(max = 150, message = "El título no puede superar 150 caracteres")
            String title,

            @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
            String description,

            Task.Priority priority,

            Long roleId
    ) {}

    public record TaskResponse(
            Long id,
            String title,
            String description,
            boolean completed,
            Task.Priority priority,
            Long roleId,
            String roleName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static TaskResponse from(Task task) {
            return new TaskResponse(
                    task.getId(),
                    task.getTitle(),
                    task.getDescription(),
                    task.isCompleted(),
                    task.getPriority(),
                    task.getRole() != null ? task.getRole().getId() : null,
                    task.getRole() != null ? task.getRole().getName() : null,
                    task.getCreatedAt(),
                    task.getUpdatedAt()
            );
        }
    }
}
