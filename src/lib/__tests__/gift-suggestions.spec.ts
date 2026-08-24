import { describe, it, expect, vi } from 'vitest';

describe('Gift Suggestions', () => {
  it('should return curated offline suggestions when no API key', async () => {
    // Mock environment without API key
    const suggestions = await getSuggestionsOffline('birthday', 'electronics', '$50-100');
    
    expect(suggestions).toBeDefined();
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toHaveProperty('name');
    expect(suggestions[0]).toHaveProperty('url');
  });

  it('should validate API response and sanitize HTML', async () => {
    const mockResponse = {
      suggestions: [
        { name: 'Item <script>alert(1)</script>', url: 'https://example.com' },
        { name: 'Clean Item', url: 'https://safe.com' },
      ],
    };
    
    const sanitized = sanitizeSuggestions(mockResponse.suggestions);
    
    expect(sanitized[0].name).toBe('Item alert(1)');
    expect(sanitized[0].name).not.toContain('<script>');
  });

  it('should enforce rate limit (8 requests/min per user)', async () => {
    const userId = 'test-user-123';
    const rateLimiter = new RateLimiter(8, 60000); // 8 per minute
    
    // Simulate 9 requests
    for (let i = 0; i < 9; i++) {
      const allowed = await rateLimiter.check(userId);
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
    
    const result = await getSuggestions('birthday', 'budget', 'error-api-key');
    
    // Should fall back to offline suggestions
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
