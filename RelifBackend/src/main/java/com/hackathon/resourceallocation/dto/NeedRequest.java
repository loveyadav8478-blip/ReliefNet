package com.hackathon.resourceallocation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NeedRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be under 255 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String locationName;
    private Double latitude;
    private Double longitude;

    private String reporterName;
    private String reporterContact;
}
