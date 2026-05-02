package com.hackathon.resourceallocation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.regex.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiVisionService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    // ─────────────────────────────────────────────────────────────────────────────
    // RESULT RECORD — fully extended
    // ─────────────────────────────────────────────────────────────────────────────

    public record ImageAnalysisResult(

            // ── Core (existing) ──────────────────────────────────────────────
            String title,
            String description,
            String category,             // FOOD | MEDICAL | SHELTER | WATER | OTHER
            String urgency,              // LOW | MEDIUM | HIGH | CRITICAL
            int    priorityScore,        // 1–100
            String reasoning,
            String suggestedSkills,

            // ── Location (existing + NER fallback NEW) ────────────────────
            String locationHint,         // visible in image (Gemini)
            String locationNormalized,   // matched to known city/state (NEW)
            double locationConfidence,   // 0.0–1.0 (NEW)

            // ── People count (NEW) ───────────────────────────────────────────
            Integer peopleAffected,      // from visible text/banners/signs in image
            String  crowdDensity,        // NONE | SMALL | MODERATE | LARGE | MASS (NEW)

            // ── Language in image (NEW) ──────────────────────────────────────
            String  textLanguageInImage, // "en" | "hi" | "mixed" | "none"
            String  extractedTextFromImage, // raw text visible in image (NEW)
            String  translatedImageText,    // if Hindi text found in image (NEW)

            // ── Confidence (NEW) ─────────────────────────────────────────────
            double categoryConfidence,
            double urgencyConfidence,
            double overallConfidence,
            String confidenceLabel,      // HIGH | MEDIUM | LOW

            // ── Explainability (NEW) ─────────────────────────────────────────
            List<String> alternateCategories,
            List<String> visualCues,     // what Gemini actually saw (NEW)

            // ── Pipeline metadata (NEW) ──────────────────────────────────────
            boolean analysisSuccessful,
            boolean usedFallback,
            List<String> warnings
    ) {}

    // ─────────────────────────────────────────────────────────────────────────────
    // INDIA CITIES for location normalization
    // ─────────────────────────────────────────────────────────────────────────────

    private static final List<String> INDIA_CITIES = List.of(
            "Mumbai","Delhi","New Delhi","Bangalore","Bengaluru","Kolkata","Chennai","Hyderabad",
            "Ahmedabad","Pune","Surat","Jaipur","Lucknow","Kanpur","Nagpur","Indore","Bhopal",
            "Visakhapatnam","Patna","Vadodara","Ghaziabad","Ludhiana","Agra","Nashik","Faridabad",
            "Meerut","Rajkot","Varanasi","Aurangabad","Ranchi","Amritsar","Allahabad","Prayagraj",
            "Coimbatore","Jodhpur","Madurai","Raipur","Kota","Guwahati","Chandigarh","Mysuru",
            "Gurugram","Noida","Dehradun","Kochi","Udaipur","Jammu","Mangaluru","Ayodhya",
            "Gorakhpur","Azamgarh","Jhansi","Mathura","Aligarh",
            "Uttarakhand","Bihar","Uttar Pradesh","Maharashtra","Rajasthan","Gujarat","Punjab",
            "Haryana","Odisha","Kerala","Jharkhand","Assam","Himachal Pradesh","Chhattisgarh",
            "West Bengal","Tamil Nadu","Karnataka","Telangana","Andhra Pradesh","Madhya Pradesh"
    );

    private static final Pattern DEVANAGARI = Pattern.compile("[\\u0900-\\u097F]+");

    private static final List<Pattern> PEOPLE_PATTERNS = List.of(
            Pattern.compile("(\\d[\\d,]*)\\s*(?:people|persons?|families|victims?|affected|individuals?)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:affecting|displaced?|suffering|serving)\\s+(\\d[\\d,]*)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:around|nearly|approximately|about|over)\\s+(\\d[\\d,]*)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("(\\d[\\d,]{2,})")
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // MAIN PUBLIC METHOD
    // ─────────────────────────────────────────────────────────────────────────────

    public ImageAnalysisResult analyzeImage(byte[] imageBytes, String mimeType) {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        List<String> warnings = new ArrayList<>();

        String prompt = """
            You are an emergency response AI for an NGO disaster coordination system.

            Carefully analyze this image for community needs, distress signals, or emergencies.
            Also carefully READ any text visible in the image (signs, banners, notices, handwritten notes).

            Look for:
            - People in distress or needing help
            - Damaged infrastructure (flooded roads, collapsed buildings)
            - Shortage signs (empty food stalls, dry taps, burned homes)
            - Handwritten or printed distress messages or banners (in ANY language including Hindi)
            - Overcrowded relief camps or queues — estimate crowd size
            - Sick or injured individuals
            - Environmental hazards (fire, flood, drought, contamination)
            - Any numbers, counts, or statistics visible in the image

            Respond ONLY in valid JSON with no markdown or backticks:
            {
              "title": "<short 5-10 word title>",
              "description": "<2-3 sentence description of what is visible>",
              "category": "FOOD|MEDICAL|SHELTER|WATER|OTHER",
              "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
              "priority_score": <integer 1-100>,
              "category_confidence": <float 0.0-1.0>,
              "urgency_confidence": <float 0.0-1.0>,
              "reasoning": "<one sentence explaining urgency assessment>",
              "suggested_skills": "<comma-separated: medical,driving,food_distribution etc>",
              "alternate_categories": "<comma-separated runner-up categories or empty>",
              "visual_cues": "<comma-separated list of what you actually saw>",
              "location_hint": "<any visible text, signs, landmarks or location text visible>",
              "extracted_text": "<ALL text visible in image, in original language>",
              "text_language": "en|hi|mixed|none",
              "translated_text": "<English translation if text was in Hindi, else empty>",
              "people_affected": <integer if visible or estimable, else -1>,
              "crowd_density": "NONE|SMALL|MODERATE|LARGE|MASS",
              "confidence": "HIGH|MEDIUM|LOW"
            }

            If NO emergency or community need is visible, respond with:
            {
              "title": "No emergency detected",
              "description": "The image does not appear to show an emergency situation.",
              "category": "OTHER",
              "urgency": "LOW",
              "priority_score": 5,
              "category_confidence": 0.9,
              "urgency_confidence": 0.9,
              "reasoning": "No visible signs of emergency or distress.",
              "suggested_skills": "",
              "alternate_categories": "",
              "visual_cues": "",
              "location_hint": "",
              "extracted_text": "",
              "text_language": "none",
              "translated_text": "",
              "people_affected": -1,
              "crowd_density": "NONE",
              "confidence": "HIGH"
            }
            """;

        try {
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("role", "user", "parts", List.of(
                                    Map.of("text", prompt),
                                    Map.of("inline_data", Map.of(
                                            "mime_type", mimeType,
                                            "data", base64Image
                                    ))
                            ))
                    ),
                    "generationConfig", Map.of("temperature", 0.2, "maxOutputTokens", 800)
            );

            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/models/gemini-1.5-flash:generateContent")
                            .queryParam("key", geminiApiKey)
                            .build())
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseAndEnrich(response, warnings);

        } catch (Exception e) {
            log.error("Gemini Vision API call failed: {}", e.getMessage());
            warnings.add("Gemini Vision API unavailable — returning fallback result");
            return fallbackResult(warnings);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PARSE + LOCAL ENRICHMENT
    // ─────────────────────────────────────────────────────────────────────────────

    private ImageAnalysisResult parseAndEnrich(String rawResponse, List<String> warnings) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            String   text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();
            text = text.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
            JsonNode json = objectMapper.readTree(text);

            // ── Core fields ──
            String category = sanitizeEnum(json.path("category").asText("OTHER"),
                    new String[]{"FOOD","MEDICAL","SHELTER","WATER","OTHER"}, "OTHER");
            String urgency  = sanitizeEnum(json.path("urgency").asText("MEDIUM"),
                    new String[]{"LOW","MEDIUM","HIGH","CRITICAL"}, "MEDIUM");
            int    score    = clamp(json.path("priority_score").asInt(50), 1, 100);

            // ── Confidence ──
            double catConf  = clampD(json.path("category_confidence").asDouble(0.7), 0, 1);
            double urgConf  = clampD(json.path("urgency_confidence").asDouble(0.7),  0, 1);

            // ── Extracted text & language ──
            String extractedText     = json.path("extracted_text").asText("").trim();
            String textLang          = json.path("text_language").asText("none").trim();
            String translatedImgText = json.path("translated_text").asText("").trim();

            // ── Validate: if Gemini says "none" but we detect Devanagari in extracted text
            if (textLang.equals("none") && !extractedText.isEmpty()
                    && DEVANAGARI.matcher(extractedText).find()) {
                textLang = "hi";
                warnings.add("Devanagari script detected in image text — overriding language to 'hi'");
            }

            // ── Location: Gemini hint + normalize to known city ──
            String locHint       = json.path("location_hint").asText("").trim();
            String locNormalized = normalizeLocation(locHint);
            double locConf       = locNormalized.equals("unknown") ? 0.0
                    : locHint.equals(locNormalized)   ? 0.90 : 0.75;
            if (locNormalized.equals("unknown"))
                warnings.add("Location not identified in image");

            // ── People count: Gemini value first, then regex on extracted text ──
            int    geminiPeople = json.path("people_affected").asInt(-1);
            Integer people      = geminiPeople > 0 ? geminiPeople
                    : extractPeopleCount(extractedText + " " + locHint);
            if (people == null) warnings.add("No people count detected");

            String crowdDensity = sanitizeEnum(json.path("crowd_density").asText("NONE"),
                    new String[]{"NONE","SMALL","MODERATE","LARGE","MASS"}, "NONE");

            // ── Skills: enrich based on category if Gemini returned empty ──
            String skills = json.path("suggested_skills").asText("").trim();
            if (skills.isBlank()) skills = defaultSkills(category);

            // ── Alternates & visual cues ──
            List<String> alts = parseCSV(json.path("alternate_categories").asText(""));
            List<String> cues = parseCSV(json.path("visual_cues").asText(""));
            if (cues.isEmpty()) warnings.add("No specific visual cues returned by model");

            // ── Overall confidence ──
            double overall = (catConf + urgConf + locConf) / 3.0;

            // ── Gemini-level warnings ──
            String gemWarn = json.path("warnings").asText("").trim();
            if (!gemWarn.isEmpty()) warnings.add("Model: " + gemWarn);

            return new ImageAnalysisResult(
                    json.path("title").asText("Unspecified community need"),
                    json.path("description").asText("Details extracted from image."),
                    category, urgency, score,
                    json.path("reasoning").asText("Image-based analysis."),
                    skills,
                    locHint, locNormalized, round2(locConf),
                    people, crowdDensity,
                    textLang, extractedText,
                    translatedImgText.isEmpty() ? null : translatedImgText,
                    round2(catConf), round2(urgConf), round2(overall), confidenceLabel(overall),
                    alts, cues,
                    true, false, warnings
            );

        } catch (Exception e) {
            log.error("Failed to parse Gemini Vision response: {}", e.getMessage());
            warnings.add("Response parse failed: " + e.getMessage());
            return fallbackResult(warnings);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // LOCATION NORMALIZATION
    // ─────────────────────────────────────────────────────────────────────────────

    private String normalizeLocation(String raw) {
        if (raw == null || raw.isBlank()) return "unknown";
        String lower = raw.toLowerCase();

        // Direct match
        for (String city : INDIA_CITIES) {
            if (lower.contains(city.toLowerCase())) return city;
        }

        // Preposition pattern inside raw hint
        Matcher m = Pattern.compile(
                "\\b(?:in|at|near|from|of)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})"
        ).matcher(raw);
        while (m.find()) {
            String candidate = m.group(1);
            for (String city : INDIA_CITIES) {
                if (city.equalsIgnoreCase(candidate)) return city;
            }
        }

        // Return raw if it looks like a proper noun (Title Case) even if not in list
        if (raw.matches("[A-Z][a-zA-Z ]+")) return raw.trim();
        return "unknown";
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PEOPLE COUNT from visible text in image
    // ─────────────────────────────────────────────────────────────────────────────

    private Integer extractPeopleCount(String text) {
        if (text == null || text.isBlank()) return null;
        String lower = text.toLowerCase();
        for (Pattern p : PEOPLE_PATTERNS) {
            Matcher m = p.matcher(lower);
            int best = -1;
            while (m.find()) {
                try {
                    int n = Integer.parseInt(m.group(1).replace(",", ""));
                    if (n >= 1 && n <= 10_000_000) best = Math.max(best, n);
                } catch (NumberFormatException ignored) {}
            }
            if (best > 0) return best;
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // FALLBACK (when Gemini Vision completely unavailable)
    // ─────────────────────────────────────────────────────────────────────────────

    private ImageAnalysisResult fallbackResult(List<String> warnings) {
        return new ImageAnalysisResult(
                "Image report submitted — manual review required",
                "An image was uploaded. AI vision analysis is currently unavailable. Manual review required.",
                "OTHER", "MEDIUM", 50,
                "AI vision analysis unavailable — manual review required.",
                "logistics,coordination",
                "", "unknown", 0.0,
                null, "NONE",
                "none", "", null,
                0.0, 0.0, 0.0, "LOW",
                List.of(), List.of(),
                false, true, warnings
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────────

    private String defaultSkills(String category) {
        return switch (category) {
            case "MEDICAL"  -> "medical,first_aid,nursing";
            case "FOOD"     -> "cooking,food_distribution,logistics";
            case "SHELTER"  -> "construction,shelter_management";
            case "WATER"    -> "water_supply,sanitation";
            default         -> "logistics,driving,coordination";
        };
    }

    private String sanitizeEnum(String value, String[] allowed, String defaultValue) {
        for (String a : allowed) if (a.equalsIgnoreCase(value)) return a;
        return defaultValue;
    }

    private int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(max, val));
    }

    private double clampD(double val, double min, double max) {
        return Math.max(min, Math.min(max, val));
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private String confidenceLabel(double conf) {
        if (conf >= 0.75) return "HIGH";
        if (conf >= 0.50) return "MEDIUM";
        return "LOW";
    }

    private List<String> parseCSV(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
