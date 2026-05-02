package com.hackathon.resourceallocation.controller;

import com.hackathon.resourceallocation.dto.ImageReportResponse;
import com.hackathon.resourceallocation.dto.NeedImageResponse;
import com.hackathon.resourceallocation.service.ImageReportService;
import com.hackathon.resourceallocation.service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@Slf4j
@RequiredArgsConstructor
public class ImageReportController {

    private final ImageReportService imageReportService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    // ── POST /api/reports/image ───────────────────────────────────
    /**
     * Reporter submits 1–5 images describing a community need.
     *
     * Request: multipart/form-data
     *   - images[]      : 1–5 image files (JPEG/PNG/WEBP)
     *   - reporterName  : reporter's name (optional)
     *   - reporterContact: phone or email (optional)
     *   - locationName  : text description of location (optional)
     *   - latitude      : GPS lat (optional)
     *   - longitude     : GPS lng (optional)
     *
     * Response: { needId, message, imageCount, imageUrls[], status }
     *
     * Security: Public endpoint — no token required (reporters are public users)
     */
    @PostMapping("/api/reports/image")
    public ResponseEntity<ImageReportResponse> submitImageReport(
            @RequestPart("images") List<MultipartFile> images,
            @RequestParam(required = false) String reporterName,
            @RequestParam(required = false) String reporterContact,
            @RequestParam(required = false) String locationName,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) throws IOException {

        log.info("Image report received: {} image(s) from reporter: {}",
                images.size(), reporterName);

        ImageReportResponse response = imageReportService.submitImageReport(
                images, reporterName, reporterContact, locationName, latitude, longitude);

        return ResponseEntity.accepted().body(response); // 202 Accepted (async processing)
    }

    // ── GET /api/needs/{id}/images ────────────────────────────────
    /**
     * List all images attached to a need (for coordinator dashboard).
     */
    @GetMapping("/api/needs/{needId}/images")
    public ResponseEntity<List<NeedImageResponse>> getImagesForNeed(@PathVariable Long needId) {
        List<NeedImageResponse> images = imageReportService.getImagesForNeed(needId)
                .stream().map(NeedImageResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(images);
    }

    // ── POST /api/needs/{id}/reanalyze ────────────────────────────
    /**
     * COORDINATOR+ can force re-analysis of a need's images.
     */
    @PostMapping("/api/needs/{needId}/reanalyze")
    public ResponseEntity<ImageReportResponse> reanalyze(@PathVariable Long needId) {
        return ResponseEntity.ok(imageReportService.reanalyzeImages(needId));
    }

    // ── GET /api/images/** ────────────────────────────────────────
    /**
     * Serve stored images directly from the uploads folder.
     *
     * Example: GET /api/images/needs/2024/04/uuid.jpg
     *
     * Spring's static resource handling could also do this,
     * but this controller gives us access control hooks if needed.
     */
    @GetMapping("/api/images/**")
    public ResponseEntity<Resource> serveImage(jakarta.servlet.http.HttpServletRequest request)
            throws MalformedURLException {

        // Extract path after /api/images/
        String requestPath = request.getRequestURI();
        String relativePath = requestPath.replaceFirst(".*/api/images/", "");

        Path filePath = Paths.get(uploadDir).resolve(relativePath).normalize();

        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        // Detect content type
        String contentType = detectContentType(relativePath);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filePath.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    private String detectContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif"))  return "image/gif";
        return "image/jpeg"; // default
    }
}