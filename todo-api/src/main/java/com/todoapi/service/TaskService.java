package com.todoapi.service;

import com.todoapi.dto.TaskDTO.TaskRequest;
import com.todoapi.dto.TaskDTO.TaskResponse;
import com.todoapi.exception.TaskNotFoundException;
import com.todoapi.model.Role;
import com.todoapi.model.Task;
import com.todoapi.repository.RoleRepository;
import com.todoapi.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository repository;
    private final RoleRepository roleRepository;

    public TaskService(TaskRepository repository, RoleRepository roleRepository) {
        this.repository = repository;
        this.roleRepository = roleRepository;
    }

    public List<TaskResponse> findAll() {
        return repository.findAll().stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse findById(Long id) {
        return TaskResponse.from(getTaskOrThrow(id));
    }

    public List<TaskResponse> findByStatus(boolean completed) {
        return repository.findByCompleted(completed).stream()
                .map(TaskResponse::from)
                .toList();
    }

    public List<TaskResponse> findByPriority(Task.Priority priority) {
        return repository.findByPriority(priority).stream()
                .map(TaskResponse::from)
                .toList();
    }

    public List<TaskResponse> findByRoleId(Long roleId) {
        return repository.findByRoleId(roleId).stream()
                .map(TaskResponse::from)
                .toList();
    }

    public List<TaskResponse> search(String keyword) {
        return repository.findByTitleContainingIgnoreCase(keyword).stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse create(TaskRequest request) {
        Role role = resolveRole(request.roleId());
        Task task = new Task(
                request.title(),
                request.description(),
                request.priority() != null ? request.priority() : Task.Priority.MEDIUM,
                role
        );
        return TaskResponse.from(repository.save(task));
    }

    public TaskResponse update(Long id, TaskRequest request) {
        Task task = getTaskOrThrow(id);
        task.setTitle(request.title());
        task.setDescription(request.description());
        if (request.priority() != null) task.setPriority(request.priority());
        task.setRole(resolveRole(request.roleId()));
        return TaskResponse.from(repository.save(task));
    }

    public TaskResponse toggleCompleted(Long id) {
        Task task = getTaskOrThrow(id);
        task.setCompleted(!task.isCompleted());
        return TaskResponse.from(repository.save(task));
    }

    public void delete(Long id) {
        getTaskOrThrow(id);
        repository.deleteById(id);
    }

    private Task getTaskOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
    }

    private Role resolveRole(Long roleId) {
        if (roleId == null) return null;
        return roleRepository.findById(roleId).orElse(null);
    }
}
