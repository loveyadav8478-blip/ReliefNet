package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.VolunteerRequest;
import com.hackathon.resourceallocation.dto.VolunteerResponse;
import com.hackathon.resourceallocation.exception.ResourceNotFoundException;
import com.hackathon.resourceallocation.model.Volunteer;
import com.hackathon.resourceallocation.repository.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VolunteerService {

    private final VolunteerRepository volunteerRepository;

    @Transactional
    public VolunteerResponse createVolunteer(VolunteerRequest request) {
        Volunteer volunteer = Volunteer.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .skills(request.getSkills())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationName(request.getLocationName())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .radiusKm(request.getRadiusKm() != null ? request.getRadiusKm() : 10)
                .build();
        return VolunteerResponse.from(volunteerRepository.save(volunteer));
    }

    public List<VolunteerResponse> getAllVolunteers(Boolean availableOnly) {
        List<Volunteer> volunteers = Boolean.TRUE.equals(availableOnly)
                ? volunteerRepository.findByIsAvailableTrue()
                : volunteerRepository.findAll();
        return volunteers.stream().map(VolunteerResponse::from).collect(Collectors.toList());
    }

    public VolunteerResponse getVolunteerById(Long id) {
        return VolunteerResponse.from(getOrThrow(id));
    }

    @Transactional
    public VolunteerResponse updateAvailability(Long id, boolean available) {
        Volunteer v = getOrThrow(id);
        v.setIsAvailable(available);
        return VolunteerResponse.from(volunteerRepository.save(v));
    }

    @Transactional
    public VolunteerResponse updateVolunteer(Long id, VolunteerRequest request) {
        Volunteer v = getOrThrow(id);
        if (request.getName() != null) v.setName(request.getName());
        if (request.getEmail() != null) v.setEmail(request.getEmail());
        if (request.getPhone() != null) v.setPhone(request.getPhone());
        if (request.getSkills() != null) v.setSkills(request.getSkills());
        if (request.getLatitude() != null) v.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) v.setLongitude(request.getLongitude());
        if (request.getLocationName() != null) v.setLocationName(request.getLocationName());
        if (request.getIsAvailable() != null) v.setIsAvailable(request.getIsAvailable());
        if (request.getRadiusKm() != null) v.setRadiusKm(request.getRadiusKm());
        return VolunteerResponse.from(volunteerRepository.save(v));
    }

    private Volunteer getOrThrow(Long id) {
        return volunteerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found: " + id));
    }
}