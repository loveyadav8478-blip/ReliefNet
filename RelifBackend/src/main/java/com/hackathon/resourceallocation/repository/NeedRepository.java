package com.hackathon.resourceallocation.repository;

import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NeedRepository extends JpaRepository<Need, Long> {

    List<Need> findByStatusOrderByPriorityScoreDesc(Need.NeedStatus status);
    List<Need> findByCategoryOrderByPriorityScoreDesc(Need.Category category);
    List<Need> findByUrgencyOrderByCreatedAtDesc(Need.UrgencyLevel urgency);
    List<Need> findAllByOrderByPriorityScoreDesc();

    @Query("SELECT n FROM Need n WHERE n.latitude IS NOT NULL AND n.longitude IS NOT NULL ORDER BY n.priorityScore DESC")
    List<Need> findAllWithCoordinates();

    @Query("SELECT n FROM Need n WHERE n.urgency IS NULL OR n.priorityScore IS NULL")
    List<Need> findUnanalyzedNeeds();

    long countByStatus(Need.NeedStatus status);
    long countByUrgency(Need.UrgencyLevel urgency);

    List<Need> findByStatusAndCategoryOrderByPriorityScoreDesc(Need.NeedStatus status, Need.Category category);

    @Query("SELECT n FROM Need n WHERE LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(n.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "ORDER BY n.priorityScore DESC")
    List<Need> searchByKeyword(@Param("keyword") String keyword);

    List<Need> findByUrgencyOrderByPriorityScoreDesc(Need.UrgencyLevel urgency);

    List<Need> findByStatusAndUrgencyOrderByPriorityScoreDesc(
            Need.NeedStatus status, Need.UrgencyLevel urgency);

    List<Need> findByUrgencyAndCategoryOrderByPriorityScoreDesc(
            Need.UrgencyLevel urgency, Need.Category category);

    List<Need> findByStatusAndCategoryAndUrgencyOrderByPriorityScoreDesc(
            Need.NeedStatus status, Need.Category category, Need.UrgencyLevel urgency);

    List<Need> findByCreatedBy(User user);
    List<Need> findByCreatedByAndStatus(User user, Need.NeedStatus status);
}