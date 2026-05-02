package com.hackathon.resourceallocation.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "needs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Need {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private UrgencyLevel urgency;

    @Column(name = "priority_score")
    private Integer priorityScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private NeedStatus status = NeedStatus.OPEN;

    // ── Location ─────────────────────────────────────────────────
    private Double latitude;
    private Double longitude;

    @Column(name = "location_name")
    private String locationName;

    @Column(name = "ai_detected_location")
    private String aiDetectedLocation;

    @Column(name = "location_confidence")
    private Double locationConfidence;

    // ── Reporter ─────────────────────────────────────────────────
    @Column(name = "reporter_name")
    private String reporterName;

    @Column(name = "reporter_contact")
    private String reporterContact;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    // ── AI analysis — core ────────────────────────────────────────
    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(name = "suggested_skills")
    private String suggestedSkills;

    // ── AI analysis — confidence ──────────────────────────────────
    @Column(name = "category_confidence")
    private Double categoryConfidence;

    @Column(name = "urgency_confidence")
    private Double urgencyConfidence;

    @Column(name = "overall_confidence")
    private Double overallConfidence;

    @Column(name = "confidence_label", length = 10)
    private String confidenceLabel;

    // ── AI analysis — enrichment ──────────────────────────────────
    @Column(name = "people_affected")
    private Integer peopleAffected;

    @ElementCollection
    @CollectionTable(name = "need_matched_keywords", joinColumns = @JoinColumn(name = "need_id"))
    @Column(name = "keyword")
    private List<String> matchedKeywords;

    @ElementCollection
    @CollectionTable(name = "need_alternate_categories", joinColumns = @JoinColumn(name = "need_id"))
    @Column(name = "category_name")
    private List<String> alternateCategories;

    @Column(name = "detected_language", length = 10)
    private String detectedLanguage;

    @Column(name = "translated_text", columnDefinition = "TEXT")
    private String translatedText;

    @Column(name = "ai_used_fallback")
    private Boolean aiUsedFallback;

    @ElementCollection
    @CollectionTable(name = "need_ai_warnings", joinColumns = @JoinColumn(name = "need_id"))
    @Column(name = "warning", columnDefinition = "TEXT")
    private List<String> aiWarnings;

    // ── Image-specific fields ─────────────────────────────────────
    @Column(name = "crowd_density", length = 20)
    private String crowdDensity;

    @Column(name = "text_language_in_image", length = 10)
    private String textLanguageInImage;

    @Column(name = "extracted_text_from_image", columnDefinition = "TEXT")
    private String extractedTextFromImage;

    @Column(name = "translated_image_text", columnDefinition = "TEXT")
    private String translatedImageText;

    @ElementCollection
    @CollectionTable(name = "need_visual_cues", joinColumns = @JoinColumn(name = "need_id"))
    @Column(name = "cue", columnDefinition = "TEXT")
    private List<String> visualCues;

    // ── Source & timestamps ───────────────────────────────────────
    @Column(length = 10)
    private String source;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "need", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Task> tasks;

    // ── Enums ─────────────────────────────────────────────────────
    public enum Category {
        FOOD, MEDICAL, SHELTER, WATER, OTHER
    }

    public enum UrgencyLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum NeedStatus {
        OPEN, ASSIGNED, IN_PROGRESS, RESOLVED
    }
}