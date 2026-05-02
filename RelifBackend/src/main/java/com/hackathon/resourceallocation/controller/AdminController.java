package com.hackathon.resourceallocation.controller;

import com.hackathon.resourceallocation.dto.AuthDTOs.*;
import com.hackathon.resourceallocation.dto.UserResponse;
import com.hackathon.resourceallocation.service.AdminUserService;
import com.hackathon.resourceallocation.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")   // entire controller is ADMIN only
@RequiredArgsConstructor
public class AdminController {

    private final AdminUserService adminUserService;
    private final AuthService authService;
//    GET /api/admin/users
//    List all registered users.
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }


//   GET /api/admin/users/{id}
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUserById(id));
    }

//    POST /api/admin/users/coordinator
//    Admin creates a COORDINATOR account (cannot self-register as coordinator).
//    Body: { "name": "...", "email": "...", "password": "..." }
    @PostMapping("/users/coordinator")
    public ResponseEntity<UserResponse> createCoordinator(@RequestBody Map<String, String> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                adminUserService.createCoordinator(
                        body.get("name"),
                        body.get("email"),
                        body.get("password")
                )
        );
    }

//    PATCH /api/admin/users/{id}/role
//    Change a user's role.
//    Body: { "role": "COORDINATOR" }
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminUserService.updateRole(id, body.get("role")));
    }

//    PATCH /api/admin/users/{id}/activate    → activate
//    PATCH /api/admin/users/{id}/deactivate  → deactivate
    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<UserResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.toggleActive(id, true));
    }

    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.toggleActive(id, false));
    }

//    DELETE /api/admin/users/{id}
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

}