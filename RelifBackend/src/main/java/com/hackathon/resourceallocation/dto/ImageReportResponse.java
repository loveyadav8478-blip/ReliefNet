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
public class ImageReportResponse {

    // ── Core (existing) ──────────────────────────────────────────
    private Long         needId;
    private String       message;
    private int          imageCount;
    private List<String> imageUrls;

    // PENDING_AI_ANALYSIS | REANALYSIS_TRIGGERED | COMPLETE
    private String       status;

    // ── AI result summary (NEW) — populated after analysis ───────
    private String       detectedCategory;       // FOOD | MEDICAL | SHELTER | WATER | OTHER
    private String       detectedUrgency;        // LOW | MEDIUM | HIGH | CRITICAL
    private Integer      priorityScore;          // 1–100
    private Double       overallConfidence;      // 0.0–1.0
    private String       confidenceLabel;        // HIGH | MEDIUM | LOW

    // ── Location (NEW) ───────────────────────────────────────────
    private String       locationHint;           // raw text from image
    private String       locationNormalized;     // matched to known city/state
    private Double       locationConfidence;     // 0.0–1.0

    // ── People (NEW) ─────────────────────────────────────────────
    private Integer      peopleAffected;
    private String       crowdDensity;           // NONE|SMALL|MODERATE|LARGE|MASS

    // ── Image text extraction (NEW) ──────────────────────────────
    private String       extractedTextFromImage; // all text visible in image
    private String       textLanguageInImage;    // en | hi | mixed | none
    private String       translatedImageText;    // English translation if Hindi

    // ── Explainability (NEW) ─────────────────────────────────────
    private String       reasoning;
    private List<String> visualCues;
    private List<String> alternateCategories;
    private List<String> warnings;

    // ── Pipeline metadata (NEW) ──────────────────────────────────
    private Boolean      analysisSuccessful;
    private Boolean      usedFallback;
    private int          imagesSuccessfullyAnalyzed;
    private int          imagesFailed;
}