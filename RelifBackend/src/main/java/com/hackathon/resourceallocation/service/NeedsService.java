
package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.NeedRequest;
import com.hackathon.resourceallocation.dto.NeedResponse;
import com.hackathon.resourceallocation.exception.ResourceNotFoundException;
import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.User;
import com.hackathon.resourceallocation.repository.NeedRepository;
import com.hackathon.resourceallocation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class NeedsService {

    private final NeedRepository needRepository;
    private final AIService aiService;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────
    // OWNERSHIP CHECK
    // ─────────────────────────────────────────────────────────────

    public boolean isOwner(Long needId, String username) {
        Need need = needRepository.findById(needId)
                .orElseThrow(() -> new RuntimeException("Need not found"));
        return need.getCreatedBy().getName().equals(username);
    }

    // ─────────────────────────────────────────────────────────────
    // MY NEEDS (REPORTER)
    // ─────────────────────────────────────────────────────────────

    public List<NeedResponse> getMyNeeds(String status) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<Need> needs = (status != null)
                ? needRepository.findByCreatedByAndStatus(user, Need.NeedStatus.valueOf(status.toUpperCase()))
                : needRepository.findByCreatedBy(user);

        return needs.stream().map(NeedResponse::from).toList();
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE NEED
    // ─────────────────────────────────────────────────────────────

    public void triggerAsyncAnalysis(Long needId) {
        try {
            analyzeNeedAsync(needId);
        } catch (Exception e) {
            log.error("Async wrapper failed safely", e);
        }
    }

    @Transactional
    public NeedResponse createNeed(NeedRequest request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + auth.getName()));

        Need need = Need.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .locationName(request.getLocationName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .reporterName(request.getReporterName())
                .reporterContact(request.getReporterContact())
                .status(Need.NeedStatus.OPEN)
                .source("TEXT")
                .createdBy(user)
                .build();

        Need saved = needRepository.save(need);
        log.info("Created new need with ID: {}", saved.getId());

        return NeedResponse.from(saved);
    }

    // ─────────────────────────────────────────────────────────────
    // ASYNC AI ANALYSIS — maps ALL new fields
    // ─────────────────────────────────────────────────────────────

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void analyzeNeedAsync(Long needId) {
        try {
            Need need = needRepository.findById(needId)
                    .orElseThrow(() -> new RuntimeException("Need not found"));

            AIService.AIAnalysisResult result =
                    aiService.analyzeNeed(need.getTitle(), need.getDescription());

            if (result != null) {
                applyAnalysisResult(need, result);
                needRepository.save(need);
                log.info("AI analysis saved for need {}: category={} urgency={} score={}",
                        needId, result.category(), result.urgency(), result.priorityScore());
            } else {
                log.warn("AI returned null for need {}", needId);
            }

        } catch (Exception e) {
            log.error("AI analysis failed for need {}", needId, e);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // MANUAL TRIGGER ANALYSIS — maps ALL new fields
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public NeedResponse triggerAnalysis(Long id) {
        Need need = getOrThrow(id);
        AIService.AIAnalysisResult result =
                aiService.analyzeNeed(need.getTitle(), need.getDescription());

        applyAnalysisResult(need, result);
        return NeedResponse.from(needRepository.save(need));
    }

    // ─────────────────────────────────────────────────────────────
    // SHARED MAPPER — applies ALL AIAnalysisResult fields to Need
    // ─────────────────────────────────────────────────────────────

    private void applyAnalysisResult(Need need, AIService.AIAnalysisResult result) {
        // Core
        need.setCategory(Need.Category.valueOf(result.category()));
        need.setUrgency(Need.UrgencyLevel.valueOf(result.urgency()));
        need.setPriorityScore(result.priorityScore());
        need.setAiReasoning(result.reasoning());
        need.setSuggestedSkills(result.suggestedSkills());

        // Confidence
        need.setCategoryConfidence(result.categoryConfidence());
        need.setUrgencyConfidence(result.urgencyConfidence());
        need.setOverallConfidence(result.overallConfidence());
        need.setConfidenceLabel(result.confidenceLabel());

        // Enrichment
        need.setPeopleAffected(result.peopleAffected());
        need.setMatchedKeywords(result.matchedKeywords());
        need.setAlternateCategories(result.alternateCategories());

        // Language
        need.setDetectedLanguage(result.detectedLanguage());
        need.setTranslatedText(result.translatedText());

        // Location
        need.setAiDetectedLocation(result.aiDetectedLocation());
        need.setLocationConfidence(result.locationConfidence());

        // Pipeline metadata
        need.setAiUsedFallback(result.aiUsedFallback());
        need.setAiWarnings(result.aiWarnings());
    }

    // ─────────────────────────────────────────────────────────────
    // GET ALL NEEDS (filtered)
    // ─────────────────────────────────────────────────────────────

    public List<NeedResponse> getAllNeeds(String status, String category,
                                          String urgency, String keyword) {
        if (keyword != null && !keyword.isBlank()) {
            return needRepository.searchByKeyword(keyword)
                    .stream().map(NeedResponse::from).collect(Collectors.toList());
        }

        boolean hasStatus   = status   != null && !status.isBlank();
        boolean hasCategory = category != null && !category.isBlank();
        boolean hasUrgency  = urgency  != null && !urgency.isBlank();

        Need.NeedStatus   statusEnum   = hasStatus   ? Need.NeedStatus.valueOf(status.toUpperCase())   : null;
        Need.Category     categoryEnum = hasCategory ? Need.Category.valueOf(category.toUpperCase())   : null;
        Need.UrgencyLevel urgencyEnum  = hasUrgency  ? Need.UrgencyLevel.valueOf(urgency.toUpperCase()): null;

        if (hasStatus && hasCategory && hasUrgency)
            return needRepository.findByStatusAndCategoryAndUrgencyOrderByPriorityScoreDesc(
                            statusEnum, categoryEnum, urgencyEnum)
                    .stream().map(NeedResponse::from).collect(Collectors.toList());

        if (hasStatus && hasUrgency)
            return needRepository.findByStatusAndUrgencyOrderByPriorityScoreDesc(statusEnum, urgencyEnum)
                    .stream().map(NeedResponse::from).collect(Collectors.toList());

        if (hasUrgency && hasCategory)
            return needRepository.findByUrgencyAndCategoryOrderByPriorityScoreDesc(urgencyEnum, categoryEnum)
                    .stream().map(NeedResponse::from).collect(Collectors.toList());

        if (hasUrgency)
            return needRepository.findByUrgencyOrderByPriorityScoreDesc(urgencyEnum)
                    .stream().map(NeedResponse::from).collect(Collectors.toList());

        if (hasStatus && hasCategory)
            return needRepository.findByStatusAndCategoryOrderByPriorityScoreDesc(statusEnum, categoryEnum)
                    .stream().map(NeedResponse::from).collect(Collectors.toList());

        if (hasStatus)
            return needRepository.findByStatusOrderByPriorityScoreDesc(statusEnum)
                    .stream().map(NeedResponse::from).collect(Collectors.toList());

        if (hasCategory)
            return needRepository.findByCategoryOrderByPriorityScoreDesc(categoryEnum)
                    .stream().map(NeedResponse::from).collect(Collectors.toList());

        return needRepository.findAllByOrderByPriorityScoreDesc()
                .stream().map(NeedResponse::from).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────
    // OTHER ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    public List<NeedResponse> getNeedsForMap() {
        return needRepository.findAllWithCoordinates()
                .stream().map(NeedResponse::from).collect(Collectors.toList());
    }

    public NeedResponse getNeedById(Long id) {
        return NeedResponse.from(getOrThrow(id));
    }

    @Transactional
    public NeedResponse updateStatus(Long id, String status) {
        Need need = getOrThrow(id);
        need.setStatus(Need.NeedStatus.valueOf(status.toUpperCase()));
        return NeedResponse.from(needRepository.save(need));
    }

    @Transactional
    public void deleteNeed(Long id) {
        needRepository.deleteById(id);
    }

    private Need getOrThrow(Long id) {
        return needRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Need not found with ID: " + id));
    }
}