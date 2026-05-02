package com.hackathon.resourceallocation.dto;

import com.hackathon.resourceallocation.model.Task;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private Long needId;
    private String needTitle;
    private String needUrgency;
    private String needCategory;
    private Long volunteerId;
    private String volunteerName;
    private String volunteerPhone;
    private String status;
    private String notes;
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;

    public static TaskResponse from(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .needId(task.getNeed().getId())
                .needTitle(task.getNeed().getTitle())
                .needUrgency(task.getNeed().getUrgency() != null ? task.getNeed().getUrgency().name() : null)
                .needCategory(task.getNeed().getCategory() != null ? task.getNeed().getCategory().name() : null)
                .volunteerId(task.getVolunteer().getId())
                .volunteerName(task.getVolunteer().getName())
                .volunteerPhone(task.getVolunteer().getPhone())
                .status(task.getStatus().name())
                .notes(task.getNotes())
                .assignedAt(task.getAssignedAt())
                .completedAt(task.getCompletedAt())
                .build();
    }
}