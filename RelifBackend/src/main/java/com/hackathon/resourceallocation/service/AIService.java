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
public class AIService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    // ─────────────────────────────────────────────────────────────
    // RESULT RECORD — field names match NeedsService exactly
    // ─────────────────────────────────────────────────────────────

    public record AIAnalysisResult(

            // Core
            String category,
            String urgency,
            int    priorityScore,

            // Confidence
            double categoryConfidence,
            double urgencyConfidence,
            double overallConfidence,
            String confidenceLabel,

            // Explainability
            String reasoning,
            List<String> matchedKeywords,
            List<String> alternateCategories,

            // Skills
            String suggestedSkills,

            // Location — named aiDetectedLocation to match NeedsService
            String aiDetectedLocation,
            double locationConfidence,

            // People
            Integer peopleAffected,

            // Language
            String detectedLanguage,
            String translatedText,

            // Pipeline metadata — named aiUsedFallback to match NeedsService
            boolean analysisSuccessful,
            boolean aiUsedFallback,
            List<String> aiWarnings
    ) {}

    // ─────────────────────────────────────────────────────────────
    // KEYWORD TAXONOMY
    // ─────────────────────────────────────────────────────────────

    private static final Map<String, List<String>> CATEGORY_KEYWORDS = Map.of(
            "FOOD",    List.of("food","meal","hungry","hunger","starvation","starving","eat","rice",
                    "wheat","ration","malnutrition","malnourished","feeding","bhojan",
                    "khaana","roti","rasad","bhookha"),
            "MEDICAL", List.of("medical","medicine","hospital","injur","sick","sickness","pain",
                    "insulin","blood","doctor","nurse","health","disease","epidemic",
                    "outbreak","cholera","malaria","dengue","fever","treatment","surgery",
                    "dawai","dawa","bimari","aushadhi","ilaaj","sehat","aspatal"),
            "SHELTER", List.of("shelter","home","house","roof","sleep","flood","fire","displacement",
                    "displaced","homeless","tent","tarpaulin","relief camp","refugee",
                    "aashray","ghar","makaan","chhat","visthapit"),
            "WATER",   List.of("water","drink","contamin","borewell","tanker","pipeline","drought",
                    "dehydration","sanitation","hygiene","sewage","pani","paani","jal",
                    "sukha","pyaas"),
            "OTHER", List.of(
                    "streetlight","electricity","road","bridge","power","signal",
                    "internet","communication","logistics","infrastructure","light",
                    "cable","network","transport","drainage","garbage","waste",
                    "bijli","sadak","nali","kachra"
            )
    );

    private static final Map<String, List<String>> URGENCY_KEYWORDS = Map.of(
            "CRITICAL", List.of("dying","death","deaths","life-threatening","critical","sos",
                    "hours","immediate","immediately","emergency","aapatkaal"),
            "HIGH",     List.of("urgent","urgently","severe","serious","danger","quickly",
                    "days","child","children","sankat","tatkal"),
            "MEDIUM",   List.of("soon","needed","lacking","shortage","insufficient","missing",
                    "zarurat","kami","jaldi"),
            "LOW",      List.of("planning","future","proposal","awareness","research","initiative")
    );

    private static final List<String> INDIA_CITIES = List.of(
            "Mumbai","Delhi","New Delhi","Bangalore","Bengaluru","Kolkata","Chennai","Hyderabad",
            "Ahmedabad","Pune","Surat","Jaipur","Lucknow","Kanpur","Nagpur","Indore","Bhopal",
            "Visakhapatnam","Patna","Vadodara","Ghaziabad","Ludhiana","Agra","Nashik","Faridabad",
            "Meerut","Rajkot","Varanasi","Aurangabad","Ranchi","Amritsar","Allahabad","Prayagraj",
            "Coimbatore","Jodhpur","Madurai","Raipur","Kota","Guwahati","Chandigarh","Mysuru",
            "Gurgaon","Gurugram","Noida","Bareilly","Moradabad","Jalandhar","Bhubaneswar",
            "Dehradun","Kochi","Udaipur","Ajmer","Jammu","Mangaluru","Ayodhya","Lakhimpur",
            "Sitapur","Muzaffarpur","Gorakhpur","Azamgarh","Jhansi","Mathura","Aligarh",
            "Uttarakhand","Bihar","Uttar Pradesh","Maharashtra","Rajasthan","Gujarat","Punjab",
            "Haryana","Odisha","Kerala","Jharkhand","Assam","Himachal Pradesh","Chhattisgarh",
            "Modinagar","Hapur","Bulandshahr","Saharanpur","Muzaffarnagar"
    );

    private static final Pattern DEVANAGARI = Pattern.compile("[\\u0900-\\u097F]+");

    private static final List<Pattern> PEOPLE_PATTERNS = List.of(
            Pattern.compile("(\\d[\\d,]*)\\s*(?:people|persons?|individuals?|families|households?|victims?|affected)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:affecting|impacted?|displaced?|suffering)\\s+(\\d[\\d,]*)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:around|nearly|approximately|about|over|more than)\\s+(\\d[\\d,]*)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("(\\d[\\d,]{2,})")
    );

    // ─────────────────────────────────────────────────────────────
    // PUBLIC ENTRY POINT
    // ─────────────────────────────────────────────────────────────

    public AIAnalysisResult analyzeNeed(String title, String description) {
        List<String> warnings = new ArrayList<>();

        String combined      = title + " " + description;
        String detectedLang  = detectLanguage(combined);
        String translatedText = null;
        String processedText = combined;

        if (detectedLang.equals("hi") || detectedLang.equals("mixed")) {
            String translated = translateViaGemini(combined);
            if (translated != null) {
                translatedText = translated;
                processedText  = translated;
                log.info("Translated ({}) text for analysis", detectedLang);
            } else {
                warnings.add("Hindi translation failed — processing original text");
            }
        }

        LocalAnalysis local = runLocalAnalysis(processedText, warnings);

        AIAnalysisResult geminiResult = null;
        try {
            geminiResult = callGemini(title, description, detectedLang, warnings);
        } catch (Exception e) {
            log.warn("Gemini call failed", e);
            warnings.add("Gemini API unavailable — fallback used");
            geminiResult = null;
        }

        return buildFinalResult(geminiResult, local, detectedLang, translatedText, warnings);
    }

    // ─────────────────────────────────────────────────────────────
    // GEMINI CALL
    // ─────────────────────────────────────────────────────────────

    private AIAnalysisResult callGemini(String title, String description,
                                        String lang, List<String> warnings) {
        String prompt = """
                You are an emergency response AI for an NGO disaster coordination system.
                Analyze the following community need and respond ONLY in valid JSON.
                Do not include markdown, backticks, or any extra text.

                Language detected: %s
                Need Title: %s
                Description: %s

                Respond with EXACTLY this JSON structure:
                {
                  "category": "FOOD|MEDICAL|SHELTER|WATER|OTHER",
                  "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
                  "priority_score": <integer 1-100>,
                  "category_confidence": <float 0.0-1.0>,
                  "urgency_confidence": <float 0.0-1.0>,
                  "reasoning": "<one sentence explaining urgency assessment>",
                  "suggested_skills": "<comma-separated: e.g. medical,driving,food_distribution>",
                  "alternate_categories": "<comma-separated runner-up categories or empty>",
                  "location": "<any location name mentioned in the text, or empty string>",
                  "people_affected": <integer or -1 if unknown>,
                  "warnings": "<any concerns about data quality or ambiguity, or empty string>"
                }
                """.formatted(lang, title, description);

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{ Map.of("text", prompt) })
                },
                "generationConfig", Map.of("temperature", 0.1, "maxOutputTokens", 500)
        );

        String response = webClient.post()
                .uri(geminiApiUrl + "/v1/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)   // ← requestBody, not body
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return parseGeminiResponse(response, warnings);
    }

    private AIAnalysisResult parseGeminiResponse(String rawResponse, List<String> warnings) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();
            text = text.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
            JsonNode json = objectMapper.readTree(text);

            String category = sanitizeEnum(json.path("category").asText("OTHER"),
                    new String[]{"FOOD","MEDICAL","SHELTER","WATER","OTHER"}, "OTHER");
            String urgency  = sanitizeEnum(json.path("urgency").asText("MEDIUM"),
                    new String[]{"LOW","MEDIUM","HIGH","CRITICAL"}, "MEDIUM");
            double catConf  = clampDouble(json.path("category_confidence").asDouble(0.7), 0, 1);
            double urgConf  = clampDouble(json.path("urgency_confidence").asDouble(0.7),  0, 1);
            double overall  = (catConf + urgConf) / 2.0;

            String locRaw  = json.path("location").asText("").trim();
            int    people  = json.path("people_affected").asInt(-1);
            String gemWarn = json.path("warnings").asText("").trim();
            if (!gemWarn.isEmpty()) warnings.add("Gemini: " + gemWarn);

            List<String> alts = parseCommaSeparated(json.path("alternate_categories").asText(""));

            // Return partial result — lang/translatedText filled in buildFinalResult
            return new AIAnalysisResult(
                    category, urgency,
                    clamp(json.path("priority_score").asInt(50), 1, 100),
                    catConf, urgConf, overall, confidenceLabel(overall),
                    json.path("reasoning").asText("AI analysis completed."),
                    List.of(),                          // keywords added from local in merge
                    alts,
                    json.path("suggested_skills").asText(""),
                    locRaw.isEmpty() ? null : locRaw,   // null = let local extraction win
                    locRaw.isEmpty() ? 0.0 : 0.85,
                    people < 0 ? null : people,
                    null, null,                         // lang + translatedText set in merge
                    true, false,
                    warnings
            );
        } catch (Exception e) {
            log.error("Gemini response parse failed: {}", e.getMessage());
            warnings.add("Gemini response parse error: " + e.getMessage());
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // LOCAL ANALYSIS
    // ─────────────────────────────────────────────────────────────

    private record LocalAnalysis(
            String category, double categoryConfidence, List<String> matchedKeywords,
            List<String> alternateCategories,
            String urgency, double urgencyConfidence,
            int priorityScore, String suggestedSkills,
            String location, double locationConfidence,
            Integer peopleAffected
    ) {}

    private LocalAnalysis runLocalAnalysis(String text, List<String> warnings) {
        String lower = text.toLowerCase();

        // ── Category scoring ──
        Map<String, Double>       catScores = new LinkedHashMap<>();
        Map<String, List<String>> catHits   = new LinkedHashMap<>();
        for (var entry : CATEGORY_KEYWORDS.entrySet()) {
            String cat = entry.getKey();
            if (cat.equals("OTHER")) continue;
            double score = 0;
            List<String> hits = new ArrayList<>();
            for (String kw : entry.getValue()) {
                if (lower.contains(kw)) { score++; hits.add(kw); }
            }
            if (score > 0) { catScores.put(cat, score); catHits.put(cat, hits); }
        }

        String topCat = "OTHER"; double topCatScore = 0; List<String> topHits = List.of();
        List<String> altCats = new ArrayList<>();
        if (!catScores.isEmpty()) {
            var sorted = catScores.entrySet().stream()
                    .sorted(Map.Entry.<String,Double>comparingByValue().reversed()).toList();
            topCat      = sorted.get(0).getKey();
            topCatScore = sorted.get(0).getValue();
            topHits     = catHits.getOrDefault(topCat, List.of());
            for (int i = 1; i < sorted.size(); i++) {
                if (sorted.get(i).getValue() >= topCatScore * 0.4)
                    altCats.add(sorted.get(i).getKey());
            }
        }
        int totalKw = CATEGORY_KEYWORDS.getOrDefault(topCat, List.of()).size();
        double catConf = totalKw > 0
                ? Math.min(topCatScore / Math.max(totalKw * 0.4, 3), 1.0) : 0.0;
        if (topCat.equals("OTHER"))
            warnings.add("Could not determine category — no keyword matches");

        // ── Urgency scoring ──
        String urgency = "LOW"; double urgConf = 0.50;
        outer:
        for (String level : List.of("CRITICAL","HIGH","MEDIUM","LOW")) {
            for (String kw : URGENCY_KEYWORDS.getOrDefault(level, List.of())) {
                if (lower.contains(kw)) {
                    urgency = level;
                    long hits = URGENCY_KEYWORDS.get(level).stream().filter(lower::contains).count();
                    urgConf = Math.min(0.60 + hits * 0.08, 1.0);
                    break outer;
                }
            }
        }

        int priorityScore = switch (urgency) {
            case "CRITICAL" -> clamp(85 + (int)(catConf * 15), 1, 100);
            case "HIGH"     -> clamp(65 + (int)(catConf * 20), 1, 100);
            case "MEDIUM"   -> clamp(40 + (int)(catConf * 20), 1, 100);
            default         -> clamp(15 + (int)(catConf * 15), 1, 100);
        };

        // ── Suggested skills ──
        String skills = switch (topCat) {
            case "MEDICAL"  -> "medical,first_aid,nursing,ambulance_driving";
            case "FOOD"     -> "cooking,food_distribution,logistics";
            case "SHELTER"  -> "construction,shelter_management,logistics";
            case "WATER"    -> "water_supply,sanitation,logistics";
            default         -> "logistics,driving,coordination";
        };

        // ── Location extraction ──
        String location = null; double locConf = 0.0;
        Matcher prepMatcher = Pattern.compile(
                "\\b(?:in|at|from|near|of|around)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})"
        ).matcher(text);
        while (prepMatcher.find()) {
            String candidate = prepMatcher.group(1);
            for (String city : INDIA_CITIES) {
                if (city.equalsIgnoreCase(candidate)) {
                    location = city; locConf = 0.85; break;
                }
            }
            if (location != null) break;
        }
        if (location == null) {
            for (String city : INDIA_CITIES) {
                if (lower.contains(city.toLowerCase())) {
                    location = city; locConf = 0.80; break;
                }
            }
        }
        if (location == null)
            warnings.add("Location not detected in text");

        // ── People count ──
        Integer people = null;
        for (Pattern p : PEOPLE_PATTERNS) {
            Matcher m = p.matcher(lower);
            int best = -1;
            while (m.find()) {
                try {
                    int n = Integer.parseInt(m.group(1).replace(",", ""));
                    if (n >= 1 && n <= 10_000_000) best = Math.max(best, n);
                } catch (NumberFormatException ignored) {}
            }
            if (best > 0) { people = best; break; }
        }
        if (people == null)
            warnings.add("No people count detected in text");

        return new LocalAnalysis(topCat, catConf, topHits, altCats,
                urgency, urgConf, priorityScore, skills,
                location, locConf, people);
    }

    // ─────────────────────────────────────────────────────────────
    // MERGE: Gemini + Local
    // ─────────────────────────────────────────────────────────────

    private AIAnalysisResult buildFinalResult(AIAnalysisResult gemini, LocalAnalysis local,
                                              String lang, String translatedText,
                                              List<String> warnings) {
        boolean usedFallback = (gemini == null);

        String   category  = gemini != null ? gemini.category()      : local.category();
        String   urgency   = gemini != null ? gemini.urgency()        : local.urgency();
        int      score     = gemini != null ? gemini.priorityScore()  : local.priorityScore();
        String   reasoning = gemini != null ? gemini.reasoning()      : "Keyword-based fallback analysis";
        String   skills    = (gemini != null && !gemini.suggestedSkills().isBlank())
                ? gemini.suggestedSkills() : local.suggestedSkills();
        List<String> alts  = (gemini != null && !gemini.alternateCategories().isEmpty())
                ? gemini.alternateCategories() : local.alternateCategories();

        // Average Gemini + local confidence for better calibration
        double catConf = gemini != null
                ? (gemini.categoryConfidence() + local.categoryConfidence()) / 2.0
                : local.categoryConfidence();
        double urgConf = gemini != null
                ? (gemini.urgencyConfidence()  + local.urgencyConfidence())  / 2.0
                : local.urgencyConfidence();
        double overall = (catConf + urgConf + local.locationConfidence()) / 3.0;

        // Location: Gemini wins if found, else local, else null
        String aiLocation = (gemini != null && gemini.aiDetectedLocation() != null
                && !gemini.aiDetectedLocation().isBlank())
                ? gemini.aiDetectedLocation() : local.location();
        double locConf = (gemini != null && gemini.aiDetectedLocation() != null
                && !gemini.aiDetectedLocation().isBlank())
                ? gemini.locationConfidence() : local.locationConfidence();

        // People: Gemini wins if found, else local regex
        Integer people = (gemini != null && gemini.peopleAffected() != null)
                ? gemini.peopleAffected() : local.peopleAffected();

        return new AIAnalysisResult(
                category, urgency, score,
                round2(catConf), round2(urgConf), round2(overall), confidenceLabel(overall),
                reasoning,
                local.matchedKeywords(),   // always from local — more reliable
                alts,
                skills,
                aiLocation, round2(locConf),
                people,
                lang, translatedText,
                true, usedFallback,
                warnings
        );
    }

    // ─────────────────────────────────────────────────────────────
    // LANGUAGE DETECTION
    // ─────────────────────────────────────────────────────────────

    private String detectLanguage(String text) {
        boolean hasDevanagari = DEVANAGARI.matcher(text).find();
        boolean hasHindiRoman = text.toLowerCase().matches(
                ".*(khaana|bhojan|dawai|pani|paani|zarurat|tatkal|aapda|ghar|aspatal|sehat).*"
        );
        if (hasDevanagari && hasHindiRoman) return "mixed";
        if (hasDevanagari) return "hi";
        if (hasHindiRoman) return "mixed";
        return "en";
    }

    // ─────────────────────────────────────────────────────────────
    // HINDI TRANSLATION via Gemini
    // ─────────────────────────────────────────────────────────────

    private String translateViaGemini(String text) {
        try {
            String prompt = "Translate the following Hindi or mixed Hindi-English text to clear English. "
                    + "Return ONLY the translated text, nothing else.\n\nText: " + text;
            Map<String, Object> body = Map.of(
                    "contents", new Object[]{ Map.of("parts", new Object[]{ Map.of("text", prompt) }) },
                    "generationConfig", Map.of("temperature", 0.1, "maxOutputTokens", 300)
            );
            String response = webClient.post()
                    .uri(geminiApiUrl + "/v1/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)   // ← body is correct here
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            JsonNode root = objectMapper.readTree(response);
            return root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText().trim();
        } catch (Exception e) {
            log.warn("Gemini translation failed: {}", e.getMessage());
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    private String sanitizeEnum(String value, String[] allowed, String defaultValue) {
        for (String a : allowed) if (a.equalsIgnoreCase(value)) return a;
        return defaultValue;
    }

    private int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(max, val));
    }

    private double clampDouble(double val, double min, double max) {
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

    private List<String> parseCommaSeparated(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
