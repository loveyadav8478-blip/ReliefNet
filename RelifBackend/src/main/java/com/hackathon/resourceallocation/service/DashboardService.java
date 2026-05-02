package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.Task;
import com.hackathon.resourceallocation.repository.NeedRepository;
import com.hackathon.resourceallocation.repository.TaskRepository;
import com.hackathon.resourceallocation.repository.VolunteerRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final NeedRepository needRepository;
    private final VolunteerRepository volunteerRepository;
    private final TaskRepository taskRepository;

    @Data @Builder
    public static class DashboardStats {
        private long totalNeeds;
        private long openNeeds;
        private long assignedNeeds;
        private long resolvedNeeds;
        private long criticalNeeds;
        private long highNeeds;
        private long totalVolunteers;
        private long availableVolunteers;
        private long activeTasks;
        private long completedTasks;
    }

    public DashboardStats getStats() {
        return DashboardStats.builder()
                .totalNeeds(needRepository.count())
                .openNeeds(needRepository.countByStatus(Need.NeedStatus.OPEN))
                .assignedNeeds(needRepository.countByStatus(Need.NeedStatus.ASSIGNED))
                .resolvedNeeds(needRepository.countByStatus(Need.NeedStatus.RESOLVED))
                .criticalNeeds(needRepository.countByUrgency(Need.UrgencyLevel.CRITICAL))
                .highNeeds(needRepository.countByUrgency(Need.UrgencyLevel.HIGH))
                .totalVolunteers(volunteerRepository.count())
                .availableVolunteers(volunteerRepository.countByIsAvailableTrue())
                .activeTasks(taskRepository.countByStatus(Task.TaskStatus.ASSIGNED)
                        + taskRepository.countByStatus(Task.TaskStatus.IN_PROGRESS))
                .completedTasks(taskRepository.countByStatus(Task.TaskStatus.COMPLETED))
                .build();
    }
}