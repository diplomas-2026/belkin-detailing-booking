package com.company.product.api.ai;

import com.company.product.api.entity.AiFeedbackSummaryEntity;
import com.company.product.api.entity.ReviewEntity;
import com.company.product.api.entity.ReviewModerationStatus;
import com.company.product.api.entity.ReviewTargetType;
import com.company.product.api.repository.AiFeedbackSummaryRepository;
import com.company.product.api.repository.ReviewRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class FeedbackSummaryService {
    private final AiProperties properties;
    private final TokenBudgetService tokenBudgetService;
    private final ReviewRepository reviewRepository;
    private final AiFeedbackSummaryRepository feedbackSummaryRepository;
    private final ChatClient chatClient;
    private final ExecutorService aiExecutor;

    public FeedbackSummaryService(AiProperties properties,
                                  TokenBudgetService tokenBudgetService,
                                  ReviewRepository reviewRepository,
                                  AiFeedbackSummaryRepository feedbackSummaryRepository,
                                  ExecutorService aiExecutor,
                                  ObjectProvider<ChatClient.Builder> chatClientBuilderProvider) {
        this.properties = properties;
        this.tokenBudgetService = tokenBudgetService;
        this.reviewRepository = reviewRepository;
        this.feedbackSummaryRepository = feedbackSummaryRepository;
        this.aiExecutor = aiExecutor;
        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        this.chatClient = builder == null ? null : builder.build();
    }

    @Transactional
    public FeedbackRunResult updateIfNeeded() {
        if (!properties.enabled()) {
            return new FeedbackRunResult(0, 0, "AI отключен (app.ai.enabled=false)");
        }
        if (chatClient == null) {
            return new FeedbackRunResult(0, 0, "ChatClient не сконфигурирован");
        }

        int updated = 0;
        int llmCalls = 0;
        Map<ReviewTargetType, String> notes = new EnumMap<>(ReviewTargetType.class);

        for (ReviewTargetType type : List.of(ReviewTargetType.WORKSHOP, ReviewTargetType.MASTER)) {
            ReviewEntity latest = reviewRepository.findTopByTargetTypeAndModerationStatusOrderByCreatedAtDesc(type, ReviewModerationStatus.APPROVED);
            if (latest == null) {
                notes.put(type, "Нет одобренных отзывов");
                continue;
            }

            AiFeedbackSummaryEntity existing = feedbackSummaryRepository.findById(type).orElse(null);
            LocalDateTime basedOn = existing == null ? null : existing.getBasedOnReviewCreatedAt();
            if (basedOn != null && !latest.getCreatedAt().isAfter(basedOn)) {
                notes.put(type, "Без изменений");
                continue;
            }

            TokenBudgetService.TokenBudgetView budget = tokenBudgetService.getBudget();
            if (budget.remaining() < 600) {
                notes.put(type, "Пропущено из-за лимита токенов");
                continue;
            }

            List<ReviewEntity> reviews = reviewRepository.findByTargetTypeAndModerationStatusOrderByCreatedAtDesc(
                    type,
                    ReviewModerationStatus.APPROVED,
                    PageRequest.of(0, 50)
            );

            SummaryResult summaryResult = generateSummary(type, reviews);
            if (summaryResult.usedTokens() <= 0) {
                notes.put(type, summaryResult.summary());
                continue;
            }
            tokenBudgetService.consume(summaryResult.usedTokens());

            AiFeedbackSummaryEntity entity = existing == null ? new AiFeedbackSummaryEntity() : existing;
            entity.setTargetType(type);
            entity.setSummary(summaryResult.summary());
            entity.setBasedOnReviewCreatedAt(latest.getCreatedAt());
            entity.setUpdatedAt(LocalDateTime.now());
            feedbackSummaryRepository.save(entity);

            updated++;
            llmCalls++;
            notes.put(type, "Обновлено");
        }

        return new FeedbackRunResult(updated, llmCalls, notes.toString());
    }

    private SummaryResult generateSummary(ReviewTargetType type, List<ReviewEntity> reviews) {
        List<String> lines = new ArrayList<>();
        for (ReviewEntity r : reviews) {
            String c = r.getComment() == null ? "" : r.getComment().trim();
            if (c.length() > 260) c = c.substring(0, 260);
            if (c.isBlank()) continue;
            lines.add("- (%d/5) %s".formatted(r.getRating(), c.replace("\n", " ").replace("\r", " ")));
        }
        String body = lines.isEmpty() ? "Нет текстовых комментариев, есть только оценки." : String.join("\n", lines);

        String system = """
                Ты помощник автосервиса/детейлинга. Сформируй короткое резюме по отзывам.
                Стиль: деловой, нейтральный, без маркетинговой воды.
                Объём: 2-3 предложения.
                Не выдумывай фактов, опирайся только на отзывы.
                Верни только текст (без markdown).
                """;

        String user = """
                Сводка по отзывам типа %s (WORKSHOP=о салоне, SERVICE=об услуге, MASTER=о мастере).
                Отзывы:
                %s
                """.formatted(type, body);

        Duration timeout = properties.llmTimeout() == null ? Duration.ofSeconds(25) : properties.llmTimeout();
        try {
            CompletableFuture<String> fut = CompletableFuture.supplyAsync(() ->
                    chatClient.prompt().system(system).user(user).call().content(), aiExecutor);
            String content = fut.get(Math.max(1, timeout.toSeconds()), TimeUnit.SECONDS);
            if (content == null) return new SummaryResult("Нет данных.", 50);
            String trimmed = content.trim();
            if (trimmed.length() > 1200) {
                trimmed = trimmed.substring(0, 1200);
            }
            int usedTokens = AiTokenEstimator.estimateTokens(system, user, trimmed);
            return new SummaryResult(trimmed, Math.max(50, usedTokens));
        } catch (java.util.concurrent.TimeoutException te) {
            return new SummaryResult("Не удалось обновить резюме автоматически (таймаут).", 0);
        } catch (Exception e) {
            return new SummaryResult("Не удалось обновить резюме автоматически.", 0);
        }
    }

    public record FeedbackRunResult(int updated, int llmCalls, String note) {}

    private record SummaryResult(String summary, int usedTokens) {}
}
