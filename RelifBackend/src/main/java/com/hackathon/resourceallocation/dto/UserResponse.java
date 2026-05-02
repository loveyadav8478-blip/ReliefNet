package com.hackathon.resourceallocation.dto;

import com.hackathon.resourceallocation.model.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private Boolean isActive;
    private Long volunteerId;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .volunteerId(user.getVolunteer() != null ? user.getVolunteer().getId() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}