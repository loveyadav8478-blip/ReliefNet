package com.hackathon.resourceallocation.controller;

import com.hackathon.resourceallocation.dto.*;
import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/needs")
@RequiredArgsConstructor
public class NeedsController {

    private final NeedsService needsService;
    private final MatchingService matchingService;

    @PostMapping
    public ResponseEntity<NeedResponse> createNeed(@Valid @RequestBody NeedRequest request) {
        NeedResponse response = needsService.createNeed(request);
        needsService.triggerAsyncAnalysis(response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
//            return ResponseEntity.status(HttpStatus.CREATED).body(needsService.createNeed(request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<NeedResponse>> getMyNeeds(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(needsService.getMyNeeds(status));
    }

    @GetMapping
    public ResponseEntity<List<NeedResponse>> getAllNeeds(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String urgency,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(needsService.getAllNeeds(status, category, urgency, keyword));
    }

    @GetMapping("/map")
    public ResponseEntity<List<NeedResponse>> getNeedsForMap() {
        return ResponseEntity.ok(needsService.getNeedsForMap());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NeedResponse> getNeedById(@PathVariable Long id) {
        return ResponseEntity.ok(needsService.getNeedById(id));
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<NeedResponse> triggerAnalysis(@PathVariable Long id) {
        return ResponseEntity.ok(needsService.triggerAnalysis(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<NeedResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(needsService.updateStatus(id, body.get("status")));
    }

    @GetMapping("/{id}/matches")
    public ResponseEntity<List<MatchResult>> getMatches(@PathVariable Long id) {
        return ResponseEntity.ok(matchingService.findMatchesForNeed(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNeed(@PathVariable Long id) {
        needsService.deleteNeed(id);
        return ResponseEntity.noContent().build();
    }
}
