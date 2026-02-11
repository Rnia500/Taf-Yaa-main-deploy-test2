import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suggestionService } from '../services/suggestionService';
import { mockSuggestions } from './mockData';

describe('SuggestionService Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should generate AI suggestions via Netlify function', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockSuggestions,
        count: 1
      })
    });

    const suggestions = await suggestionService.generateAISuggestions('tree_1', 'member_1');
    
    expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/ai-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ treeId: 'tree_1', memberId: 'member_1' })
    });
    
    expect(suggestions).toEqual(mockSuggestions);
  });

  it('should handle API errors gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    await expect(
      suggestionService.generateAISuggestions('tree_1', 'member_1')
    ).rejects.toThrow('Failed to generate AI suggestions');
  });

  it('should handle network errors', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      suggestionService.generateAISuggestions('tree_1', 'member_1')
    ).rejects.toThrow('Failed to generate AI suggestions');
  });
});
