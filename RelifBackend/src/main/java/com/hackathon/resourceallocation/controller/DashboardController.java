package com.hackathon.resourceallocation.controller;

import com.hackathon.resourceallocation.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardService.DashboardStats> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }
}