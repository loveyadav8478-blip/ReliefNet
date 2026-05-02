package com.hackathon.resourceallocation.controller;

import com.hackathon.resourceallocation.dto.AuthDTOs.*;
import com.hackathon.resourceallocation.dto.UserResponse;
import com.hackathon.resourceallocation.model.User;
import com.hackathon.resourceallocation.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

//    POST /api/auth/register
//    Public — self-registration for VOLUNTEER or REPORTER roles only.
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        ResponseEntity<AuthResponse> body = ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
        return body;
    }


//     POST /api/auth/login
//     Public — returns JWT token on success.
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }


//     GET /api/auth/me
//     Returns current logged-in user's profile.
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(UserResponse.from(user));
    }


//     POST /api/auth/change-password
//     Authenticated users can change their own password.
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.noContent().build();
    }
    /**
     * POST /api/auth/register/coordinator
     * Public — registers as COORDINATOR if invite code is correct.
     *
     * Body:
     * {
     *   "name": "Rahul Verma",
     *   "email": "rahul@ngo.com",
     *   "password": "Coord@123",
     *   "inviteCode": "NGO-COORD-2026",
     *   "volunteerId": 3          <- optional, links to existing volunteer
     * }
     */
    @PostMapping("/register/coordinator")
    public ResponseEntity<AuthResponse> registerCoordinator(
            @Valid @RequestBody CoordinatorRegisterRequest request) {
        ResponseEntity<AuthResponse> body = ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.registerCoordinator(request));
        return body;
    }
}