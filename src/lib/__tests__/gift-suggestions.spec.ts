import { describe, it, expect, vi } from 'vitest';
import { curatedSuggestions, suggestGifts, sanitizeSuggestions } from '@/lib/gift-suggest';
import { createRateLimiter } from '@/lib/ai/rate-limit';

describe('Gift Suggestions', () => {
  it('should return curated offline suggestions when no API key', async () => {
    // Mock environment without API key
    vi.stubEnv('OPENAI_API_KEY', '');
    const suggestions = await curatedSuggestions({
      occasion: 'birthday',
      interests: 'electronics',
      budgetMax: undefined,
      count: 5
    });

    expect(suggestions).toBeDefined();
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toHaveProperty('title');
    expect(suggestions[0]).toHaveProperty('notes');
  });

  it('should validate API response and sanitize HTML', async () => {
    const mockResponse = {
      suggestions: [
        { title: 'Item <script>alert(1)</script>', notes: '', url: 'https://example.com' },
        { title: 'Clean Item', notes: '', url: 'https://safe.com' },
      ],
    };

    const sanitized = sanitizeSuggestions(mockResponse.suggestions, 2);

    expect(sanitized[0].title).toBe('Item alert(1)');
    expect(sanitized[0].title).not.toContain('<script>');
  });

  it('should enforce rate limit (8 requests/min per user)', async () => {
    const userId = 'test-user-123';
    const limiter = createRateLimiter(8, 60000); // 8 per minute

    // Simulate 9 requests
    for (let i = 0; i < 9; i++) {
      const allowed = await limiter(userId);
      if (i < 8) {
        expect(allowed).toBe(true);
      } else {
        expect(allowed).toBe(false);
      }
    }
  });

  it('should handle OpenAI API errors gracefully', async () => {
    vi.mock('node-fetch', () => ({
      default: vi.fn().mockRejectedValue(new Error('API timeout')),
    }));
    vi.stubEnv('OPENAI_API_KEY', 'error-api-key');

    const result = await suggestGifts({
      occasion: 'birthday',
      interests: 'budget',
      budgetMax: undefined,
      count: 3
    });

    // Should fall back to offline suggestions
    expect(result).toBeDefined();
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.source).toBe('fallback');
  });
});