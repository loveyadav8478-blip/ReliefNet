package com.hackathon.resourceallocation.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "users", uniqueConstraints = {@UniqueConstraint(columnNames = "email")})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // BCrypt hashed

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private Role role = Role.VOLUNTEER;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    // Optional: link to Volunteer record if role == VOLUNTEER
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "volunteer_id")
    private Volunteer volunteer;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    //  Roles
    public enum Role {

//         ADMIN       –> full system access (user mgmt, delete records, view all stats)
//         COORDINATOR –> manage needs, assign volunteers, update task status
//         VOLUNTEER   –> view assigned tasks, update own task status only
//         REPORTER    –> submit community needs only (public-facing form users)

        ADMIN,
        COORDINATOR,
        VOLUNTEER,
        REPORTER
    }
}