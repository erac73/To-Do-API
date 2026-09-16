package com.todoapi.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class RoleNotFoundException extends RuntimeException {

    public RoleNotFoundException(Long id) {
        super("Rol no encontrado con id: " + id);
    }

    public RoleNotFoundException(String name) {
        super("Rol no encontrado: " + name);
    }
}
