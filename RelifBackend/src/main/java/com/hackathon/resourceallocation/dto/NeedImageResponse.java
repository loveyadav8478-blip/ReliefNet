package com.hackathon.resourceallocation.dto;

import com.hackathon.resourceallocation.model.NeedImage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NeedImageResponse {
    private Long id;
    private Long needId;
    private String originalFilename;
    private String publicUrl;
    private String contentType;
    private Long fileSizeBytes;
    private String aiExtractedText;
    private Boolean aiProcessed;
    private LocalDateTime uploadedAt;

    public static NeedImageResponse from(NeedImage img) {
        return NeedImageResponse.builder()
                .id(img.getId())
                .needId(img.getNeed().getId())
                .originalFilename(img.getOriginalFilename())
                .publicUrl(img.getPublicUrl())
                .contentType(img.getContentType())
                .fileSizeBytes(img.getFileSizeBytes())
                .aiExtractedText(img.getAiExtractedText())
                .aiProcessed(img.getAiProcessed())
                .uploadedAt(img.getUploadedAt())
                .build();
    }
}