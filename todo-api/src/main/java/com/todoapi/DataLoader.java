package com.todoapi;

import com.todoapi.model.Role;
import com.todoapi.model.Task;
import com.todoapi.repository.RoleRepository;
import com.todoapi.repository.TaskRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner loadData(TaskRepository taskRepo, RoleRepository roleRepo) {
        return args -> {
            Role dev = roleRepo.save(new Role("Desarrollo", "Tareas de desarrollo de software"));
            Role design = roleRepo.save(new Role("Diseño", "Tareas de diseño y UX"));
            Role ops = roleRepo.save(new Role("Operaciones", "Tareas de infraestructura y despliegue"));

            taskRepo.save(new Task("Configurar el proyecto", "Instalar dependencias y verificar la estructura", Task.Priority.HIGH, dev));
            taskRepo.save(new Task("Escribir los tests", "Cubrir los endpoints con pruebas unitarias e integración", Task.Priority.HIGH, dev));
            taskRepo.save(new Task("Diseñar interfaz", "Crear mockups y prototipos de la UI", Task.Priority.MEDIUM, design));
            taskRepo.save(new Task("Documentar la API", "Agregar Swagger/OpenAPI para documentación interactiva", Task.Priority.MEDIUM, dev));
            taskRepo.save(new Task("Configurar Docker", "Crear Dockerfile y docker-compose", Task.Priority.LOW, ops));
        };
    }
}
