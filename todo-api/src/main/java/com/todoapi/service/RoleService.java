package com.todoapi.service;

import com.todoapi.dto.RoleDTO.RoleRequest;
import com.todoapi.dto.RoleDTO.RoleResponse;
import com.todoapi.exception.RoleNotFoundException;
import com.todoapi.model.Role;
import com.todoapi.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {

    private final RoleRepository repository;

    public RoleService(RoleRepository repository) {
        this.repository = repository;
    }

    public List<RoleResponse> findAll() {
        return repository.findAll().stream()
                .map(RoleResponse::from)
                .toList();
    }

    public List<RoleResponse> findActive() {
        return repository.findByActive(true).stream()
                .map(RoleResponse::from)
                .toList();
    }

    public RoleResponse findById(Long id) {
        return RoleResponse.from(getRoleOrThrow(id));
    }

    public RoleResponse findByName(String name) {
        Role role = repository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new RoleNotFoundException(name));
        return RoleResponse.from(role);
    }

    public RoleResponse create(RoleRequest request) {
        if (repository.existsByNameIgnoreCase(request.name())) {
            throw new IllegalArgumentException("Ya existe un rol con el nombre: " + request.name());
        }
        Role role = new Role(request.name(), request.description());
        return RoleResponse.from(repository.save(role));
    }

    public RoleResponse update(Long id, RoleRequest request) {
        Role role = getRoleOrThrow(id);
        role.setName(request.name());
        role.setDescription(request.description());
        return RoleResponse.from(repository.save(role));
    }

    public RoleResponse toggleActive(Long id) {
        Role role = getRoleOrThrow(id);
        role.setActive(!role.isActive());
        return RoleResponse.from(repository.save(role));
    }

    public void delete(Long id) {
        Role role = getRoleOrThrow(id);
        if (!role.getTasks().isEmpty()) {
            throw new IllegalStateException("No se puede eliminar un rol que tiene tareas asignadas");
        }
        repository.deleteById(id);
    }

    private Role getRoleOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RoleNotFoundException(id));
    }
}
