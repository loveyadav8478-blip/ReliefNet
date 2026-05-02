package com.hackathon.resourceallocation.repository;

import com.hackathon.resourceallocation.model.Volunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {

    List<Volunteer> findByIsAvailableTrue();

    Optional<Volunteer> findByEmail(String email);

    // Volunteers who have a specific skill (uses LIKE on comma-separated field)
    @Query("SELECT v FROM Volunteer v WHERE v.isAvailable = true " +
            "AND LOWER(v.skills) LIKE LOWER(CONCAT('%', :skill, '%'))")
    List<Volunteer> findAvailableBySkill(@Param("skill") String skill);

    long countByIsAvailableTrue();
    List<Volunteer> findAll();
}