package com.hackathon.resourceallocation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VolunteerRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    // Comma-separated skills: "medical,driving,cooking"
    private String skills;

    private Double latitude;
    private Double longitude;
    private String locationName;

    private Boolean isAvailable = true;
    private Integer radiusKm = 10;
}