/**
 * Simple tests for theme generation tools
 */

import { generateTheme } from '../../src/tools/generate-theme';
import { generateSemanticColors } from '../../src/tools/generate-semantic-colors';

describe('Theme Generation Tools - Simple Tests', () => {
  test('generateTheme should work with basic parameters', async () => {
    const result = await generateTheme({
      theme_type: 'light',
      primary_color: '#2563eb',
    });

    expect(result.success).toBe(true);
  });

  test('generateSemanticColors should work with basic parameters', async () => {
    const result = await generateSemanticColors({
      base_palette: ['#2563eb', '#10b981', '#f59e0b'],
    });

    expect(result.success).toBe(true);
  });
});
