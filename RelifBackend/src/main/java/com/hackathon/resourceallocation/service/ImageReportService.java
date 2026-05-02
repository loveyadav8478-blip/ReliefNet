package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.ImageReportResponse;
import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.NeedImage;
import com.hackathon.resourceallocation.repository.NeedImageRepository;
import com.hackathon.resourceallocation.repository.NeedRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ImageReportService {

    private final ImageStorageService storageService;
    private final GeminiVisionService visionService;
    private final NeedRepository needRepository;
    private final NeedImageRepository needImageRepository;

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Upload images → create placeholder Need → async AI
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public ImageReportResponse submitImageReport(
            List<MultipartFile> images,
            String reporterName,
            String reporterContact,
            String locationName,
            Double latitude,
            Double longitude) throws IOException {

        if (images == null || images.isEmpty())
            throw new IllegalArgumentException("At least one image is required.");
        if (images.size() > 5)
            throw new IllegalArgumentException("Maximum 5 images per report.");

        Need need = Need.builder()
                .title("Image report — AI analysis pending...")
                .description("This need was reported via image. AI is analyzing the content.")
                .status(Need.NeedStatus.OPEN)
                .source("IMAGE")
                .reporterName(reporterName)
                .reporterContact(reporterContact)
                .locationName(locationName)
                .latitude(latitude)
                .longitude(longitude)
                .build();

        Need savedNeed = needRepository.save(need);
        log.info("Created image-based need placeholder ID: {}", savedNeed.getId());

        List<NeedImage> savedImages = new ArrayList<>();
        for (MultipartFile file : images) {
            try {
                ImageStorageService.StoredFile stored = storageService.store(file);
                NeedImage needImage = NeedImage.builder()
                        .need(savedNeed)
                        .originalFilename(stored.originalFilename())
                        .storedFilename(stored.storedFilename())
                        .filePath(stored.relativePath())
                        .publicUrl(stored.publicUrl())
                        .contentType(stored.contentType())
                        .fileSizeBytes(stored.sizeBytes())
                        .aiProcessed(false)
                        .build();
                savedImages.add(needImageRepository.save(needImage));
                log.info("Saved image {} for need {}", stored.relativePath(), savedNeed.getId());
            } catch (Exception e) {
                log.error("Failed to store image for need {}: {}", savedNeed.getId(), e.getMessage());
            }
        }

        if (savedImages.isEmpty())
            throw new IOException("All image uploads failed. Please try again.");

        analyzeImagesAsync(savedNeed.getId(), savedImages);

        return ImageReportResponse.builder()
                .needId(savedNeed.getId())
                .message("Report submitted. AI is analyzing your images.")
                .imageCount(savedImages.size())
                .imageUrls(savedImages.stream().map(NeedImage::getPublicUrl).collect(Collectors.toList()))
                .status("PENDING_AI_ANALYSIS")
                .analysisSuccessful(false)   // not done yet
                .usedFallback(false)
                .imagesSuccessfullyAnalyzed(0)
                .imagesFailed(0)
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2 (Async): AI Vision analysis → update Need with ALL fields
    // ─────────────────────────────────────────────────────────────

    @Async
    public void analyzeImagesAsync(Long needId, List<NeedImage> images) {
        doAnalyzeImages(needId, images);  // delegate to transactional method
    }

    @Transactional
    public void doAnalyzeImages(Long needId, List<NeedImage> images) {
        log.info("Async vision analysis starting for need ID: {}", needId);

        needRepository.findById(needId).ifPresent(need -> {

            GeminiVisionService.ImageAnalysisResult bestResult = null;
            int bestScore    = 0;
            int successCount = 0;
            int failCount    = 0;

            for (NeedImage image : images) {
                try {
                    byte[] bytes = storageService.readBytes(image.getFilePath());
                    GeminiVisionService.ImageAnalysisResult result =
                            visionService.analyzeImage(bytes, image.getContentType());

                    // Store per-image AI summary in NeedImage record
                    image.setAiExtractedText(buildImageSummary(result));
                    image.setAiProcessed(true);
                    needImageRepository.save(image);
                    successCount++;

                    // Keep the highest-priority result across all images
                    if (result.priorityScore() > bestScore) {
                        bestScore = result.priorityScore();
                        bestResult = result;
                    }

                    log.info("Image {} analyzed: {} / {} / score:{} / conf:{} / people:{}",
                            image.getStoredFilename(), result.category(), result.urgency(),
                            result.priorityScore(), result.overallConfidence(), result.peopleAffected());

                } catch (Exception e) {
                    failCount++;
                    log.error("Vision analysis failed for image {}: {}",
                            image.getStoredFilename(), e.getMessage());
                }
            }

            if (bestResult != null) {
                applyVisionResult(need, bestResult);
                needRepository.save(need);
                log.info("Need {} updated from vision analysis: {} / {} / score:{} / conf:{} / people:{}",
                        needId, bestResult.category(), bestResult.urgency(),
                        bestResult.priorityScore(), bestResult.overallConfidence(),
                        bestResult.peopleAffected());
            } else {
                // All AI calls failed — mark for manual review
                need.setTitle("Image report — manual review required");
                need.setDescription("Images uploaded but AI analysis failed. Coordinator review needed.");
                need.setUrgency(Need.UrgencyLevel.MEDIUM);
                need.setPriorityScore(50);
                need.setAiReasoning("AI vision analysis unavailable. Manual review required.");
                need.setAiUsedFallback(true);
                need.setAiWarnings(List.of("All " + failCount + " image analyses failed"));
                needRepository.save(need);
                log.warn("All AI analyses failed for need {}", needId);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // SHARED MAPPER — ImageAnalysisResult → Need fields
    // ─────────────────────────────────────────────────────────────

    private void applyVisionResult(Need need, GeminiVisionService.ImageAnalysisResult r) {

        // ── Core ────────────────────────────────────────────────
        need.setTitle(r.title());
        need.setDescription(r.description());

        try {
            need.setCategory(Need.Category.valueOf(r.category()));
        } catch (IllegalArgumentException e) {
            log.warn("Unknown category '{}' — defaulting to OTHER", r.category());
            need.setCategory(Need.Category.OTHER);
        }
        try {
            need.setUrgency(Need.UrgencyLevel.valueOf(r.urgency()));
        } catch (IllegalArgumentException e) {
            log.warn("Unknown urgency '{}' — defaulting to MEDIUM", r.urgency());
            need.setUrgency(Need.UrgencyLevel.MEDIUM);
        }

        need.setPriorityScore(r.priorityScore());
        need.setSuggestedSkills(r.suggestedSkills());

        // ── Reasoning — append location hint if present ─────────
        String reasoning = r.reasoning();
        if (r.locationHint() != null && !r.locationHint().isBlank())
            reasoning += " | Location visible in image: " + r.locationHint();
        need.setAiReasoning(reasoning);

        // ── Confidence (NEW) ────────────────────────────────────
        need.setCategoryConfidence(r.categoryConfidence());
        need.setUrgencyConfidence(r.urgencyConfidence());
        need.setOverallConfidence(r.overallConfidence());
        need.setConfidenceLabel(r.confidenceLabel());

        // ── Location (NEW) ──────────────────────────────────────
        // Normalized city name wins over raw hint
        String loc = (r.locationNormalized() != null && !r.locationNormalized().equals("unknown"))
                ? r.locationNormalized() : r.locationHint();
        if (loc != null && !loc.isBlank()) {
            need.setAiDetectedLocation(loc);
            need.setLocationConfidence(r.locationConfidence());
            // Backfill user-facing locationName if blank
            if (need.getLocationName() == null || need.getLocationName().isBlank())
                need.setLocationName(loc);
        }

        // ── People count (NEW) ──────────────────────────────────
        if (r.peopleAffected() != null)
            need.setPeopleAffected(r.peopleAffected());

        // ── Crowd density (NEW) ─────────────────────────────────
        need.setCrowdDensity(r.crowdDensity());

        // ── Image text extraction (NEW) ─────────────────────────
        need.setTextLanguageInImage(r.textLanguageInImage());
        need.setExtractedTextFromImage(r.extractedTextFromImage());
        need.setTranslatedImageText(r.translatedImageText());

        // ── Explainability (NEW) ────────────────────────────────
        need.setAlternateCategories(r.alternateCategories());
        need.setVisualCues(r.visualCues());

        // ── Pipeline metadata (NEW) ─────────────────────────────
        need.setAiUsedFallback(r.usedFallback());
        need.setAiWarnings(r.warnings());
    }

    // ─────────────────────────────────────────────────────────────
    // RE-ANALYZE
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public ImageReportResponse reanalyzeImages(Long needId) {
        Need need = needRepository.findById(needId)
                .orElseThrow(() -> new IllegalArgumentException("Need not found: " + needId));

        List<NeedImage> images = needImageRepository.findByNeedId(needId);
        if (images.isEmpty())
            throw new IllegalArgumentException("No images found for need: " + needId);

        images.forEach(img -> {
            img.setAiProcessed(false);
            needImageRepository.save(img);
        });

        analyzeImagesAsync(needId, images);

        return ImageReportResponse.builder()
                .needId(needId)
                .message("Re-analysis triggered for " + images.size() + " image(s).")
                .imageCount(images.size())
                .imageUrls(images.stream().map(NeedImage::getPublicUrl).collect(Collectors.toList()))
                .status("REANALYSIS_TRIGGERED")
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // GET IMAGES
    // ─────────────────────────────────────────────────────────────

    public List<NeedImage> getImagesForNeed(Long needId) {
        return needImageRepository.findByNeedId(needId);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPER — build rich per-image AI summary for NeedImage record
    // ─────────────────────────────────────────────────────────────

    private String buildImageSummary(GeminiVisionService.ImageAnalysisResult r) {
        StringBuilder sb = new StringBuilder();
        sb.append("[").append(r.category()).append("/").append(r.urgency())
                .append("/score:").append(r.priorityScore())
                .append("/conf:").append(r.overallConfidence()).append("] ");
        sb.append(r.description());

        if (r.peopleAffected() != null)
            sb.append(" | People: ").append(r.peopleAffected());
        if (r.crowdDensity() != null && !r.crowdDensity().equals("NONE"))
            sb.append(" | Crowd: ").append(r.crowdDensity());
        if (r.locationNormalized() != null && !r.locationNormalized().equals("unknown"))
            sb.append(" | Location: ").append(r.locationNormalized());
        if (r.extractedTextFromImage() != null && !r.extractedTextFromImage().isBlank())
            sb.append(" | Text in image: ").append(r.extractedTextFromImage());

        return sb.toString();
    }
}