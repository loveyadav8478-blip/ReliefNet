package com.hackathon.resourceallocation.dto;

import com.hackathon.resourceallocation.model.Need;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class NeedResponse {

    // ── Core (existing) ──────────────────────────────────────────
    private Long          id;
    private String        title;
    private String        description;
    private String        category;
    private String        urgency;
    private Integer       priorityScore;
    private String        status;

    // ── Location (existing + NEW normalized fields) ───────────────
    private Double        latitude;
    private Double        longitude;
    private String        locationName;          // user-provided
    private String        aiDetectedLocation;    // NEW: extracted by AI from text/image
    private Double        locationConfidence;    // NEW: 0.0–1.0

    // ── Reporter (existing) ──────────────────────────────────────
    private String        reporterName;
    private String        reporterContact;

    // ── AI analysis — core (existing) ────────────────────────────
    private String        aiReasoning;
    private String        suggestedSkills;

    // ── AI analysis — NEW fields ─────────────────────────────────
    private Double        categoryConfidence;    // 0.0–1.0
    private Double        urgencyConfidence;     // 0.0–1.0
    private Double        overallConfidence;     // 0.0–1.0
    private String        confidenceLabel;       // HIGH | MEDIUM | LOW
    private Integer       peopleAffected;        // extracted from text/image
    private List<String>  matchedKeywords;       // keywords that drove category
    private List<String>  alternateCategories;   // runner-up categories
    private String        detectedLanguage;      // en | hi | mixed
    private String        translatedText;        // non-null if input was Hindi
    private Boolean       aiUsedFallback;        // true if Gemini was down
    private List<String>  aiWarnings;            // non-fatal issues

    // ── Image-specific NEW fields (only populated for image reports) ──
    private String        crowdDensity;          // NONE|SMALL|MODERATE|LARGE|MASS
    private String        textLanguageInImage;   // en|hi|mixed|none
    private String        extractedTextFromImage;
    private String        translatedImageText;
    private List<String>  visualCues;            // what AI saw in the image

    // ── Source & timestamps ──────────────────────────────────────
    private String        source;                // TEXT | IMAGE
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ─────────────────────────────────────────────────────────────
    // MAPPER
    // ─────────────────────────────────────────────────────────────

    public static NeedResponse from(Need need) {
        return NeedResponse.builder()
                // core
                .id(need.getId())
                .title(need.getTitle())
                .description(need.getDescription())
                .category(need.getCategory() != null ? need.getCategory().name() : null)
                .urgency(need.getUrgency() != null ? need.getUrgency().name() : null)
                .priorityScore(need.getPriorityScore())
                .status(need.getStatus() != null ? need.getStatus().name() : null)
                // location
                .latitude(need.getLatitude())
                .longitude(need.getLongitude())
                .locationName(need.getLocationName())
                .aiDetectedLocation(need.getAiDetectedLocation())
                .locationConfidence(need.getLocationConfidence())
                // reporter
                .reporterName(need.getReporterName())
                .reporterContact(need.getReporterContact())
                // AI core
                .aiReasoning(need.getAiReasoning())
                .suggestedSkills(need.getSuggestedSkills())
                // AI new
                .categoryConfidence(need.getCategoryConfidence())
                .urgencyConfidence(need.getUrgencyConfidence())
                .overallConfidence(need.getOverallConfidence())
                .confidenceLabel(need.getConfidenceLabel())
                .peopleAffected(need.getPeopleAffected())
                .matchedKeywords(need.getMatchedKeywords())
                .alternateCategories(need.getAlternateCategories())
                .detectedLanguage(need.getDetectedLanguage())
                .translatedText(need.getTranslatedText())
                .aiUsedFallback(need.getAiUsedFallback())
                .aiWarnings(need.getAiWarnings())
                // image specific
                .crowdDensity(need.getCrowdDensity())
                .textLanguageInImage(need.getTextLanguageInImage())
                .extractedTextFromImage(need.getExtractedTextFromImage())
                .translatedImageText(need.getTranslatedImageText())
                .visualCues(need.getVisualCues())
                // meta
                .source(need.getSource())
                .createdAt(need.getCreatedAt())
                .updatedAt(need.getUpdatedAt())
                .build();
    }
}