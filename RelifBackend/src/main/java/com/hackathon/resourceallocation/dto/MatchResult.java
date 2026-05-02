package com.hackathon.resourceallocation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResult {
    private Long volunteerId;
    private String volunteerName;
    private String volunteerPhone;
    private String volunteerEmail;
    private String locationName;
    private List<String> skills;
    private Double distanceKm;
    private Integer matchScore;       // 0–100 overall score
    private Integer skillMatchScore;  // how many skills matched
    private Integer distanceScore;    // proximity score
    private String matchReason;       // human-readable explanation
}