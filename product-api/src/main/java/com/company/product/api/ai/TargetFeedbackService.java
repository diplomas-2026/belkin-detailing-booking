package com.company.product.api.ai;

import com.company.product.api.entity.*;
import com.company.product.api.repository.*;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class TargetFeedbackService {
    private final AiProperties properties;
    private final TokenBudgetService tokenBudgetService;
    private final ReviewRepository reviewRepository;
    private final WorkshopRepository workshopRepository;
    private final MasterRepository masterRepository;
    private final AiWorkshopFeedbackRepository workshopFeedbackRepository;
    private final AiMasterFeedbackRepository masterFeedbackRepository;
    private final ChatClient chatClient;
    private final ExecutorService aiExecutor;

    public TargetFeedbackService(AiProperties properties,
                                 TokenBudgetService tokenBudgetService,
                                 ReviewRepository reviewRepository,
                                 WorkshopRepository workshopRepository,
                                 MasterRepository masterRepository,
                                 AiWorkshopFeedbackRepository workshopFeedbackRepository,
                                 AiMasterFeedbackRepository masterFeedbackRepository,
                                 ExecutorService aiExecutor,
                                 ObjectProvider<ChatClient.Builder> chatClientBuilderProvider) {
        this.properties = properties;
        this.tokenBudgetService = tokenBudgetService;
        this.reviewRepository = reviewRepository;
        this.workshopRepository = workshopRepository;
        this.masterRepository = masterRepository;
        this.workshopFeedbackRepository = workshopFeedbackRepository;
        this.masterFeedbackRepository = masterFeedbackRepository;
        this.aiExecutor = aiExecutor;
        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        this.chatClient = builder == null ? null : builder.build();
    }

    @Transactional
    public RunResult updateWorkshop(Long workshopId, boolean onlyIfNew) {
        if (!properties.enabled()) return new RunResult(0, 0, "AI отключен (app.ai.enabled=false)");
        if (chatClient == null) return new RunResult(0, 0, "ChatClient не сконфигурирован");

        WorkshopEntity workshop = workshopRepository.findById(workshopId).orElse(null);
        if (workshop == null) return new RunResult(0, 0, "Салон не найден");

        ReviewEntity latest = reviewRepository.findTopByWorkshopAndModerationStatusOrderByCreatedAtDesc(workshop, ReviewModerationStatus.APPROVED);
        if (latest == null) return new RunResult(0, 0, "Нет одобренных отзывов по салону");

        AiWorkshopFeedbackEntity existing = workshopFeedbackRepository.findById(workshopId).orElse(null);
        if (onlyIfNew && existing != null && existing.getBasedOnReviewCreatedAt() != null && !latest.getCreatedAt().isAfter(existing.getBasedOnReviewCreatedAt())) {
            return new RunResult(0, 0, "Без изменений");
        }

        TokenBudgetService.TokenBudgetView budget = tokenBudgetService.getBudget();
        if (budget.remaining() < 800) return new RunResult(0, 0, "Недостаточно токенов для запуска");

        List<ReviewEntity> reviews = reviewRepository.findByWorkshopAndModerationStatusOrderByCreatedAtDesc(workshop, ReviewModerationStatus.APPROVED, PageRequest.of(0, 60));
        SummaryResult sr = generate("WORKSHOP", workshop.getName(), reviews);
        if (sr.usedTokens() <= 0) {
            return new RunResult(0, 0, sr.summary());
        }
        tokenBudgetService.consume(sr.usedTokens());

        AiWorkshopFeedbackEntity e = existing == null ? new AiWorkshopFeedbackEntity() : existing;
        e.setWorkshopId(workshopId);
        e.setSummary(sr.summary());
        e.setBasedOnReviewCreatedAt(latest.getCreatedAt());
        e.setUpdatedAt(LocalDateTime.now());
        workshopFeedbackRepository.save(e);

        return new RunResult(1, 1, "Обновлено");
    }

    @Transactional
    public RunResult updateMaster(Long masterId, boolean onlyIfNew) {
        if (!properties.enabled()) return new RunResult(0, 0, "AI отключен (app.ai.enabled=false)");
        if (chatClient == null) return new RunResult(0, 0, "ChatClient не сконфигурирован");

        MasterEntity master = masterRepository.findById(masterId).orElse(null);
        if (master == null) return new RunResult(0, 0, "Мастер не найден");

        ReviewEntity latest = reviewRepository.findTopByMasterAndModerationStatusOrderByCreatedAtDesc(master, ReviewModerationStatus.APPROVED);
        if (latest == null) return new RunResult(0, 0, "Нет одобренных отзывов по мастеру");

        AiMasterFeedbackEntity existing = masterFeedbackRepository.findById(masterId).orElse(null);
        if (onlyIfNew && existing != null && existing.getBasedOnReviewCreatedAt() != null && !latest.getCreatedAt().isAfter(existing.getBasedOnReviewCreatedAt())) {
            return new RunResult(0, 0, "Без изменений");
        }

        TokenBudgetService.TokenBudgetView budget = tokenBudgetService.getBudget();
        if (budget.remaining() < 800) return new RunResult(0, 0, "Недостаточно токенов для запуска");

        List<ReviewEntity> reviews = reviewRepository.findByMasterAndModerationStatusOrderByCreatedAtDesc(master, ReviewModerationStatus.APPROVED, PageRequest.of(0, 60));
        SummaryResult sr = generate("MASTER", master.getUser().getFullName(), reviews);
        if (sr.usedTokens() <= 0) {
            return new RunResult(0, 0, sr.summary());
        }
        tokenBudgetService.consume(sr.usedTokens());

        AiMasterFeedbackEntity e = existing == null ? new AiMasterFeedbackEntity() : existing;
        e.setMasterId(masterId);
        e.setSummary(sr.summary());
        e.setBasedOnReviewCreatedAt(latest.getCreatedAt());
        e.setUpdatedAt(LocalDateTime.now());
        masterFeedbackRepository.save(e);

        return new RunResult(1, 1, "Обновлено");
    }

    @Transactional(readOnly = true)
    public String getWorkshopSummary(Long workshopId) {
        return workshopFeedbackRepository.findById(workshopId).map(AiWorkshopFeedbackEntity::getSummary).orElse(null);
    }

    @Transactional(readOnly = true)
    public String getMasterSummary(Long masterId) {
        return masterFeedbackRepository.findById(masterId).map(AiMasterFeedbackEntity::getSummary).orElse(null);
    }

    private SummaryResult generate(String targetType, String targetName, List<ReviewEntity> reviews) {
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
                Стиль: деловой, нейтральный.
                Объём: 2-3 предложения.
                Не выдумывай фактов, опирайся только на отзывы.
                Верни только текст (без markdown).
                """;
        String user = """
                Сводка по отзывам: %s (%s).
                Отзывы:
                %s
                """.formatted(targetType, targetName, body);

        Duration timeout = properties.llmTimeout() == null ? Duration.ofSeconds(25) : properties.llmTimeout();
        try {
            CompletableFuture<String> fut = CompletableFuture.supplyAsync(() ->
                    chatClient.prompt().system(system).user(user).call().content(), aiExecutor);
            String content = fut.get(Math.max(1, timeout.toSeconds()), TimeUnit.SECONDS);
            String trimmed = content == null ? "" : content.trim();
            if (trimmed.isBlank()) trimmed = "Нет данных.";
            if (trimmed.length() > 1200) trimmed = trimmed.substring(0, 1200);
            int used = Math.max(80, AiTokenEstimator.estimateTokens(system, user, trimmed));
            return new SummaryResult(trimmed, used);
        } catch (java.util.concurrent.TimeoutException te) {
            return new SummaryResult("Не удалось обновить резюме автоматически (таймаут).", 0);
        } catch (Exception e) {
            return new SummaryResult("Не удалось обновить резюме автоматически.", 0);
        }
    }

    public record RunResult(int updated, int llmCalls, String note) {}

    private record SummaryResult(String summary, int usedTokens) {}
}
