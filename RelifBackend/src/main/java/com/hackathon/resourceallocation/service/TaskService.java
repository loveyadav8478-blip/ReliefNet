package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.TaskRequest;
import com.hackathon.resourceallocation.dto.TaskResponse;
import com.hackathon.resourceallocation.exception.ResourceNotFoundException;
import com.hackathon.resourceallocation.model.*;
import com.hackathon.resourceallocation.repository.NeedRepository;
import com.hackathon.resourceallocation.repository.TaskRepository;
import com.hackathon.resourceallocation.repository.VolunteerRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import com.hackathon.resourceallocation.model.Task;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Builder
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final NeedRepository needRepository;
    private final VolunteerRepository volunteerRepository;

    @Transactional
    public TaskResponse assignVolunteer(TaskRequest request) {
        Need need = needRepository.findById(request.getNeedId())
                .orElseThrow(() -> new ResourceNotFoundException("Need not found"));
        Volunteer volunteer = volunteerRepository.findById(request.getVolunteerId())
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found"));


        Task task = Task.builder()
                .need(need)
                .volunteer(volunteer)
                .notes(request.getNotes())
                .status(Task.TaskStatus.ASSIGNED)
                .build();

        // Update need and volunteer status
        need.setStatus(Need.NeedStatus.ASSIGNED);
        volunteer.setIsAvailable(false);
        needRepository.save(need);
        volunteerRepository.save(volunteer);

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, String status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Task.TaskStatus newStatus = Task.TaskStatus.valueOf(status.toUpperCase());
        task.setStatus(newStatus);

        if (newStatus == Task.TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
            task.getNeed().setStatus(Need.NeedStatus.RESOLVED);
            task.getVolunteer().setIsAvailable(true); // Free up volunteer
            needRepository.save(task.getNeed());
            volunteerRepository.save(task.getVolunteer());
        } else if (newStatus == Task.TaskStatus.IN_PROGRESS) {
            task.getNeed().setStatus(Need.NeedStatus.IN_PROGRESS);
            needRepository.save(task.getNeed());
        } else if (newStatus == Task.TaskStatus.CANCELLED) {
            task.getNeed().setStatus(Need.NeedStatus.OPEN);
            task.getVolunteer().setIsAvailable(true);
            needRepository.save(task.getNeed());
            volunteerRepository.save(task.getVolunteer());
        }

        return TaskResponse.from(taskRepository.save(task));
    }

    public List<TaskResponse> getAllTasks(String status) {
        List<Task> tasks = status != null
                ? taskRepository.findByStatus(Task.TaskStatus.valueOf(status.toUpperCase()))
                : taskRepository.findAll();
        return tasks.stream().map(TaskResponse::from).collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByNeed(Long needId) {
        return taskRepository.findByNeedId(needId)
                .stream().map(TaskResponse::from).collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByVolunteer(Long volunteerId) {
        return taskRepository.findByVolunteerId(volunteerId)
                .stream().map(TaskResponse::from).collect(Collectors.toList());
    }
}