package com.hackathon.resourceallocation.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class ImageStorageService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    // Only allow safe image types
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir, "needs"));
            log.info("Upload directory ready: {}", Paths.get(uploadDir).toAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + e.getMessage(), e);
        }
    }

    // ── Store a single image file ─────────────────────────────────

    public StoredFile store(MultipartFile file) throws IOException {
        validate(file);

        // Date-based sub-folder: uploads/needs/2024/04/
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path targetDir = Paths.get(uploadDir, "needs", datePath);
        Files.createDirectories(targetDir);

        // UUID filename to prevent conflicts and enumeration attacks
        String extension = getExtension(file.getOriginalFilename());
        String storedFilename = UUID.randomUUID() + extension;
        Path targetPath = targetDir.resolve(storedFilename);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String relativePath = "needs/" + datePath + "/" + storedFilename;
        String publicUrl = "/api/images/" + relativePath;

        log.info("Stored image: {} ({} bytes)", relativePath, file.getSize());

        return new StoredFile(
                file.getOriginalFilename(),
                storedFilename,
                relativePath,
                publicUrl,
                file.getContentType(),
                file.getSize(),
                targetPath.toAbsolutePath().toString()
        );
    }

    // ── Read file bytes (for AI processing) ──────────────────────

    public byte[] readBytes(String relativePath) throws IOException {
        Path filePath = Paths.get(uploadDir, relativePath);
        if (!Files.exists(filePath)) {
            throw new NoSuchFileException("Image not found: " + relativePath);
        }
        return Files.readAllBytes(filePath);
    }

    // ── Delete a file ─────────────────────────────────────────────

    public void delete(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir, relativePath);
            Files.deleteIfExists(filePath);
            log.info("Deleted image: {}", relativePath);
        } catch (IOException e) {
            log.warn("Could not delete image {}: {}", relativePath, e.getMessage());
        }
    }

    // ── Validation ────────────────────────────────────────────────

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty or missing.");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                    "File type not allowed: " + file.getContentType() +
                            ". Allowed: JPEG, PNG, WEBP, GIF");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException(
                    "File too large: " + (file.getSize() / 1024 / 1024) + "MB. Max: 10MB");
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot).toLowerCase() : ".jpg";
    }

    // ── Immutable result record ───────────────────────────────────

    public record StoredFile(
            String originalFilename,
            String storedFilename,
            String relativePath,
            String publicUrl,
            String contentType,
            long sizeBytes,
            String absolutePath
    ) {}
}