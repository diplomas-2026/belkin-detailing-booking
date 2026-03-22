package com.company.product.api.ai;

import com.company.product.api.entity.AiTokenUsageEntity;
import com.company.product.api.repository.AiTokenUsageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class TokenBudgetService {
    private final AiProperties properties;
    private final AiTokenUsageRepository tokenUsageRepository;

    public TokenBudgetService(AiProperties properties, AiTokenUsageRepository tokenUsageRepository) {
        this.properties = properties;
        this.tokenUsageRepository = tokenUsageRepository;
    }

    public LocalDate todaySamara() {
        return LocalDate.now(ZoneId.of(properties.timezoneSamara()));
    }

    @Transactional(readOnly = true)
    public TokenBudgetView getBudget() {
        LocalDate today = todaySamara();
        int used = tokenUsageRepository.findById(today).map(AiTokenUsageEntity::getUsedTokens).orElse(0);
        int limit = properties.tokenLimitPerDay();
        return new TokenBudgetView(today, limit, used, Math.max(0, limit - used));
    }

    @Transactional
    public void consume(int tokens) {
        if (tokens <= 0) {
            return;
        }
        LocalDate today = todaySamara();
        AiTokenUsageEntity usage = tokenUsageRepository.findById(today).orElseGet(() -> {
            AiTokenUsageEntity e = new AiTokenUsageEntity();
            e.setUsageDate(today);
            e.setUsedTokens(0);
            e.setUpdatedAt(LocalDateTime.now());
            return e;
        });
        usage.setUsedTokens(usage.getUsedTokens() + tokens);
        usage.setUpdatedAt(LocalDateTime.now());
        tokenUsageRepository.save(usage);
    }

    public record TokenBudgetView(LocalDate date, int limit, int used, int remaining) {}
}

