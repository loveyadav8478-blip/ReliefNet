package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.UserResponse;
import com.hackathon.resourceallocation.exception.ResourceNotFoundException;
import com.hackathon.resourceallocation.model.User;
import com.hackathon.resourceallocation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream().map(UserResponse::from).collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        return UserResponse.from(getOrThrow(id));
    }

    @Transactional
    public UserResponse updateRole(Long id, String role) {
        User user = getOrThrow(id);
        user.setRole(User.Role.valueOf(role.toUpperCase()));
        User saved = userRepository.save(user);
        log.info("Role updated for user {}: {}", saved.getEmail(), saved.getRole());
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse toggleActive(Long id, boolean active) {
        User user = getOrThrow(id);
        user.setIsActive(active);
        User saved = userRepository.save(user);
        log.info("User {} {}", saved.getEmail(), active ? "activated" : "deactivated");
        return UserResponse.from(saved);
    }

    @Transactional
    public UserResponse createCoordinator(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists: " + email);
        }
        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(User.Role.COORDINATOR)
                .isActive(true)
                .build();
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
        log.info("User {} deleted", id);
    }

    private User getOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
}