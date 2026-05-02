package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.MatchResult;
import com.hackathon.resourceallocation.exception.ResourceNotFoundException;
import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.Volunteer;
import com.hackathon.resourceallocation.repository.NeedRepository;
import com.hackathon.resourceallocation.repository.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class MatchingService {

    private final NeedRepository needRepository;
    private final VolunteerRepository volunteerRepository;

    @Value("${app.matching.max-results:5}")
    private int maxResults;

    @Value("${app.matching.default-radius-km:20}")
    private int defaultRadiusKm;

    public List<MatchResult> findMatchesForNeed(Long needId) {
        Need need = needRepository.findById(needId)
                .orElseThrow(() -> new ResourceNotFoundException("Need not found: " + needId));

        List<Volunteer> availableVolunteers = volunteerRepository.findByIsAvailableTrue();

        List<String> requiredSkills = parseSkills(need.getSuggestedSkills());

        return availableVolunteers.stream()
                .map(v -> scoreVolunteer(v, need, requiredSkills))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(MatchResult::getMatchScore).reversed())
                .limit(maxResults)
                .collect(Collectors.toList());
    }

    private MatchResult scoreVolunteer(Volunteer volunteer, Need need, List<String> requiredSkills) {
        // Skip volunteers without location data
        if (volunteer.getLatitude() == null || volunteer.getLongitude() == null) return null;

        double distance = 0;
        int distanceScore = 100; // Default if need has no coords

        if (need.getLatitude() != null && need.getLongitude() != null) {
            distance = haversineKm(
                    need.getLatitude(), need.getLongitude(),
                    volunteer.getLatitude(), volunteer.getLongitude()
            );

            int radius = volunteer.getRadiusKm() != null ? volunteer.getRadiusKm() : defaultRadiusKm;
            if (distance > radius) return null; // Outside volunteer's range

            // Linear distance score: 100 at 0km, 0 at edge of radius
            distanceScore = (int) Math.round(100.0 - (distance / radius * 100.0));
        }

        // Skill match
        List<String> volunteerSkills = parseSkills(volunteer.getSkills());
        long matchingCount = requiredSkills.stream()
                .filter(s -> volunteerSkills.stream().anyMatch(vs -> vs.equalsIgnoreCase(s)))
                .count();

        int skillScore = requiredSkills.isEmpty() ? 50
                : (int) Math.round((double) matchingCount / requiredSkills.size() * 100.0);

        // Weighted overall score: 60% skills, 40% distance
        int overallScore = (int) Math.round(skillScore * 0.6 + distanceScore * 0.4);

        String reason = buildMatchReason(matchingCount, requiredSkills.size(), distance, overallScore);

        return MatchResult.builder()
                .volunteerId(volunteer.getId())
                .volunteerName(volunteer.getName())
                .volunteerPhone(volunteer.getPhone())
                .volunteerEmail(volunteer.getEmail())
                .locationName(volunteer.getLocationName())
                .skills(volunteerSkills)
                .distanceKm(Math.round(distance * 10.0) / 10.0)
                .matchScore(overallScore)
                .skillMatchScore(skillScore)
                .distanceScore(distanceScore)
                .matchReason(reason)
                .build();
    }

    private String buildMatchReason(long skillMatches, int totalRequired, double distance, int score) {
        StringBuilder sb = new StringBuilder();
        if (totalRequired > 0) {
            sb.append(skillMatches).append("/").append(totalRequired).append(" required skills matched");
        } else {
            sb.append("General volunteer");
        }
        sb.append(String.format(", %.1f km away", distance));
        sb.append(String.format(" — Match Score: %d%%", score));
        return sb.toString();
    }

    // Haversine formula: distance between two lat/lng points in km
    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private List<String> parseSkills(String skills) {
        if (skills == null || skills.isBlank()) return Collections.emptyList();
        return Arrays.stream(skills.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}