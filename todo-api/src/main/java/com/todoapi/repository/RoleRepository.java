package com.todoapi.repository;

import com.todoapi.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByNameIgnoreCase(String name);

    List<Role> findByActive(boolean active);

    boolean existsByNameIgnoreCase(String name);
}
