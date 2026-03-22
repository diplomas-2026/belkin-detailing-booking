package com.company.product.api.dto;

import java.time.LocalDate;

public class AiDtos {
    public record TokenBudgetView(LocalDate date, int limit, int used, int remaining) {}

    public record RunResult(String job,
                            int processedOrUpdated,
                            int llmCalls,
                            String note,
                            TokenBudgetView budget) {}
}

