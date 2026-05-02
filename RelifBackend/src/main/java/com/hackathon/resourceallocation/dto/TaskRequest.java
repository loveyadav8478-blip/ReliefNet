package com.hackathon.resourceallocation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TaskRequest {

    @NotNull(message = "Need ID is required")
    private Long needId;

    @NotNull(message = "Volunteer ID is required")
    private Long volunteerId;

    private String notes;
}