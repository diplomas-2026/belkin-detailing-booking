package com.company.product.api.ai;

import com.company.product.api.entity.ReviewEntity;
import com.company.product.api.entity.ReviewModerationStatus;
import com.company.product.api.repository.ReviewRepository;
import com.company.product.api.service.BusinessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReviewAiModerationService {
    private final AiProperties properties;
    private final TokenBudgetService tokenBudgetService;
    private final ReviewRepository reviewRepository;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public ReviewAiModerationService(AiProperties properties,
                                     TokenBudgetService tokenBudgetService,
                                     ReviewRepository reviewRepository,
                                     ObjectProvider<ChatClient.Builder> chatClientBuilderProvider,
                                     ObjectMapper objectMapper) {
        this.properties = properties;
        this.tokenBudgetService = tokenBudgetService;
        this.reviewRepository = reviewRepository;
        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        this.chatClient = builder == null ? null : builder.build();
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ModerationRunResult runOnce() {
        if (!properties.enabled()) {
            return new ModerationRunResult(0, 0, "AI отключен (app.ai.enabled=false)");
        }
        if (chatClient == null) {
            return new ModerationRunResult(0, 0, "ChatClient не сконфигурирован");
        }
        // If api-key is missing, GigaChat вызов упадёт; проверим по бюджету и попробуем аккуратно

        List<ReviewEntity> pending = reviewRepository.findByModerationStatus(ReviewModerationStatus.PENDING);
        if (pending.isEmpty()) {
            return new ModerationRunResult(0, 0, "Нет новых отзывов для модерации");
        }

        int processed = 0;
        int llmCalls = 0;
        List<Long> skippedByBudget = new ArrayList<>();

        for (ReviewEntity review : pending) {
            TokenBudgetService.TokenBudgetView budget = tokenBudgetService.getBudget();
            if (budget.remaining() < 200) { // минимальный запас на один короткий запрос
                skippedByBudget.add(review.getId());
                continue;
            }

            boolean changed = moderateSingle(review);
            if (changed) {
                processed++;
            }
            if (review.getAiModeratedAt() != null) {
                llmCalls++;
            }
        }

        String note = skippedByBudget.isEmpty()
                ? "OK"
                : "Часть отзывов пропущена из-за лимита токенов: " + skippedByBudget.size();
        return new ModerationRunResult(processed, llmCalls, note);
    }

    private boolean moderateSingle(ReviewEntity review) {
        // Пустой комментарий разрешён — модерация не нужна.
        if (review.getComment() == null || review.getComment().trim().isBlank()) {
            review.setModerationStatus(ReviewModerationStatus.APPROVED);
            review.setVisible(true);
            review.setRejectionReason(null);
            review.setAiModeratedAt(LocalDateTime.now());
            reviewRepository.save(review);
            return true;
        }

        String userPrompt = """
                Отзыв:
                id=%d
                targetType=%s
                rating=%d
                comment=%s
                """.formatted(
                review.getId(),
                String.valueOf(review.getTargetType()),
                review.getRating(),
                sanitizeForPrompt(review.getComment())
        );

        String modelResponse;
        try {
            modelResponse = chatClient.prompt()
                    .system(ReviewModerationRules.SYSTEM_PROMPT)
                    .user(userPrompt)
                    .call()
                    .content();
        } catch (Exception e) {
            // Не меняем статус, чтобы повторить позже
            return false;
        }

        int usedTokens = AiTokenEstimator.estimateTokens(ReviewModerationRules.SYSTEM_PROMPT, userPrompt, modelResponse);
        tokenBudgetService.consume(usedTokens);

        ModerationDecision decision;
        try {
            decision = objectMapper.readValue(modelResponse, ModerationDecision.class);
        } catch (Exception e) {
            // Не меняем статус, чтобы повторить позже
            return false;
        }

        if ("REJECT".equalsIgnoreCase(decision.decision())) {
            String reason = decision.reason() == null || decision.reason().isBlank()
                    ? "Отзыв отклонён по правилам модерации."
                    : decision.reason().trim();
            if (reason.length() > 480) {
                reason = reason.substring(0, 480);
            }
            review.setModerationStatus(ReviewModerationStatus.REJECTED);
            review.setVisible(false);
            review.setRejectionReason(reason);
            review.setAiModeratedAt(LocalDateTime.now());
            reviewRepository.save(review);
            return true;
        }

        if (!"APPROVE".equalsIgnoreCase(decision.decision())) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "Некорректный ответ AI модерации");
        }

        review.setModerationStatus(ReviewModerationStatus.APPROVED);
        review.setVisible(true);
        review.setRejectionReason(null);
        review.setAiModeratedAt(LocalDateTime.now());
        reviewRepository.save(review);
        return true;
    }

    private static String sanitizeForPrompt(String text) {
        if (text == null) return "";
        String trimmed = text.trim();
        if (trimmed.length() > 900) {
            trimmed = trimmed.substring(0, 900);
        }
        // Avoid breaking JSON / prompt formatting too much
        return trimmed.replace("\r", " ").replace("\n", " ");
    }

    public record ModerationDecision(String decision, String reason) {}

    public record ModerationRunResult(int processed, int llmCalls, String note) {}
}
