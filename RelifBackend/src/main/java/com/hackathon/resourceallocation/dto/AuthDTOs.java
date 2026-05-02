package com.hackathon.resourceallocation.dto;

import com.hackathon.resourceallocation.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

//Nested DTOs for Auth

public class AuthDTOs {

    // Register
    @Data
    public static class RegisterRequest {

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        // Allowed: VOLUNTEER, REPORTER
        // COORDINATOR and ADMIN can only be assigned by an ADMIN
        private User.Role role = User.Role.VOLUNTEER;
    }

    //Login
    @Data
    public static class LoginRequest {

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    //Auth Response (returned after login/register)
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String tokenType = "Bearer";
        private long expiresIn;       // milliseconds
        private Long userId;
        private String name;
        private String email;
        private String role;
        private Long volunteerId;
    }

    //Change Password
    @Data
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank @Size(min = 6) private String newPassword;
    }
    @Data
    public static class CoordinatorRegisterRequest {

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        // Must match app.coordinator.invite-code in application.properties
        @NotBlank(message = "Invite code is required")
        private String inviteCode;

        // Optional: link to an existing volunteer record
        private Long volunteerId;
    }
}