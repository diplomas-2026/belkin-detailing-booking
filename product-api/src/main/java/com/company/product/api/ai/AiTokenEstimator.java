package com.company.product.api.ai;

public final class AiTokenEstimator {
    private AiTokenEstimator() {}

    public static int estimateTokens(String... texts) {
        long chars = 0;
        if (texts != null) {
            for (String t : texts) {
                if (t != null) {
                    chars += t.length();
                }
            }
        }
        // rough heuristic: 1 token ~ 4 chars for Cyrillic/Latin mixed text
        return (int) Math.max(1, Math.min(Integer.MAX_VALUE, (chars + 3) / 4));
    }
}

