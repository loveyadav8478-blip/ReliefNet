package com.hackathon.resourceallocation.controller;

import com.hackathon.resourceallocation.dto.*;
import com.hackathon.resourceallocation.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> assignVolunteer(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.assignVolunteer(request));
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAll(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(taskService.getAllTasks(status));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, body.get("status")));
    }

    @GetMapping("/by-need/{needId}")
    public ResponseEntity<List<TaskResponse>> getByNeed(@PathVariable Long needId) {
        return ResponseEntity.ok(taskService.getTasksByNeed(needId));
    }

    @GetMapping("/by-volunteer/{volunteerId}")
    public ResponseEntity<List<TaskResponse>> getByVolunteer(@PathVariable Long volunteerId) {
        return ResponseEntity.ok(taskService.getTasksByVolunteer(volunteerId));
    }
}