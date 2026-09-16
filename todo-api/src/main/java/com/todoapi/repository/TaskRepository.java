package com.todoapi.repository;

import com.todoapi.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByCompleted(boolean completed);

    List<Task> findByPriority(Task.Priority priority);

    List<Task> findByTitleContainingIgnoreCase(String keyword);

    List<Task> findByRoleId(Long roleId);
}
