package com.hackathon.resourceallocation.repository;

import com.hackathon.resourceallocation.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByNeedId(Long needId);

    List<Task> findByVolunteerId(Long volunteerId);

    List<Task> findByStatus(Task.TaskStatus status);

    Optional<Task> findByNeedIdAndVolunteerId(Long needId, Long volunteerId);

    long countByStatus(Task.TaskStatus status);

    // Active tasks for a volunteer
    @Query("SELECT t FROM Task t WHERE t.volunteer.id = :volunteerId " +
            "AND t.status IN ('ASSIGNED', 'IN_PROGRESS')")
    List<Task> findActiveTasksByVolunteer(Long volunteerId);

    // Recent completed tasks for impact dashboard
    @Query("SELECT t FROM Task t WHERE t.status = 'COMPLETED' ORDER BY t.completedAt DESC")
    List<Task> findRecentlyCompleted();
}