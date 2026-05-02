package com.hackathon.resourceallocation.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "need_images")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NeedImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to the need this image belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "need_id", nullable = false)
    private Need need;

    // Original filename from uploader
    @Column(name = "original_filename")
    private String originalFilename;

    // Stored filename on disk (UUID-based, prevents collisions)
    @Column(name = "stored_filename", nullable = false)
    private String storedFilename;

    // Relative path: "uploads/needs/2024/04/uuid.jpg"
    @Column(name = "file_path", nullable = false)
    private String filePath;

    // Public URL to serve the image: "/api/images/uuid.jpg"
    @Column(name = "public_url")
    private String publicUrl;

    @Column(name = "content_type")
    private String contentType; // "image/jpeg", "image/png", etc.

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    // What Gemini Vision extracted from this specific image
    @Column(name = "ai_extracted_text", columnDefinition = "TEXT")
    private String aiExtractedText;

    // Whether AI has already processed this image
    @Column(name = "ai_processed")
    @Builder.Default
    private Boolean aiProcessed = false;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
}