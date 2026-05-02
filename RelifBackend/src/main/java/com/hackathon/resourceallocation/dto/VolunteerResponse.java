package com.hackathon.resourceallocation.dto;

import com.hackathon.resourceallocation.model.Volunteer;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class VolunteerResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String skills;
    private List<String> skillList;
    private Double latitude;
    private Double longitude;
    private String locationName;
    @com.fasterxml.jackson.annotation.JsonProperty("isAvailable")
    private Boolean isAvailable;
    private Integer radiusKm;
    private LocalDateTime createdAt;

    public static VolunteerResponse from(Volunteer v) {
        List<String> skillList = v.getSkills() != null
                ? List.of(v.getSkills().split(","))
                : List.of();

        return VolunteerResponse.builder()
                .id(v.getId())
                .name(v.getName())
                .email(v.getEmail())
                .phone(v.getPhone())
                .skills(v.getSkills())
                .skillList(skillList)
                .latitude(v.getLatitude())
                .longitude(v.getLongitude())
                .locationName(v.getLocationName())
                .isAvailable(v.getIsAvailable())
                .radiusKm(v.getRadiusKm())
                .createdAt(v.getCreatedAt())
                .build();
    }
}