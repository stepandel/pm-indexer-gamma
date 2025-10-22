import { describe, test, expect } from 'vitest';
import { DateExtractor } from './date-extractor';

describe('DateExtractor', () => {
  const extractor = new DateExtractor();

  describe('Month-Year Pattern (Pattern 8)', () => {
    test('should correctly parse "December 2024" as end of December 2024', () => {
      const results = extractor.extractDatesFromText('December 2024', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].matchedText).toBe('December 2024');
      expect(results[0].patternType).toBe('month_year');
      expect(results[0].confidence).toBe(0.85);
      expect(results[0].dateTime.getUTCFullYear()).toBe(2024);
      expect(results[0].dateTime.getUTCMonth()).toBe(11); // December = 11
      expect(results[0].dateTime.getUTCDate()).toBe(31); // Last day of December
    });

    test('should correctly parse "Dec 2024" as end of December 2024', () => {
      const results = extractor.extractDatesFromText('Dec 2024', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].matchedText).toBe('Dec 2024');
      expect(results[0].patternType).toBe('month_year');
      expect(results[0].confidence).toBe(0.85);
      expect(results[0].dateTime.getFullYear()).toBe(2024);
      expect(results[0].dateTime.getMonth()).toBe(11);
    });

    test('should parse other months correctly', () => {
      const testCases = [
        { input: 'January 2025', month: 0, lastDay: 31 },
        { input: 'February 2024', month: 1, lastDay: 29 }, // Leap year
        { input: 'March 2024', month: 2, lastDay: 31 },
        { input: 'April 2024', month: 3, lastDay: 30 },
      ];

      testCases.forEach(({ input, month, lastDay }) => {
        const results = extractor.extractDatesFromText(input, 'test');
        expect(results).toHaveLength(1);
        expect(results[0].patternType).toBe('month_year');
        expect(results[0].dateTime.getUTCMonth()).toBe(month);
        expect(results[0].dateTime.getUTCDate()).toBe(lastDay);
      });
    });
  });

  describe('Month-Day-Year Pattern (Pattern 1)', () => {
    test('should correctly parse "December 20, 2024"', () => {
      const results = extractor.extractDatesFromText('December 20, 2024', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].matchedText).toBe('December 20, 2024');
      expect(results[0].patternType).toBe('month_day_year');
      expect(results[0].confidence).toBe(0.9);
      expect(results[0].dateTime.getUTCFullYear()).toBe(2024);
      expect(results[0].dateTime.getUTCMonth()).toBe(11);
      expect(results[0].dateTime.getUTCDate()).toBe(20);
    });

    test('should correctly parse "Dec 20, 2024"', () => {
      const results = extractor.extractDatesFromText('Dec 20, 2024', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].matchedText).toBe('Dec 20, 2024');
      expect(results[0].patternType).toBe('month_day_year');
      expect(results[0].confidence).toBe(0.9);
    });

    test('should parse date ranges correctly', () => {
      const results = extractor.extractDatesFromText('Aug 22-28, 2021', 'test');

      // May have multiple matches due to different patterns, but should have the range pattern
      expect(results.length).toBeGreaterThan(0);
      const rangeMatch = results.find(r => r.patternType === 'month_day_range');
      expect(rangeMatch).toBeDefined();
      expect(rangeMatch?.matchedText).toBe('Aug 22-28, 2021');
      expect(rangeMatch?.dateTime.getUTCDate()).toBe(28); // Should use end date
    });
  });

  describe('ISO Date Pattern (Pattern 2)', () => {
    test('should correctly parse ISO format dates', () => {
      const results = extractor.extractDatesFromText('2025-10-08', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].matchedText).toBe('2025-10-08');
      expect(results[0].patternType).toBe('iso_date');
      expect(results[0].confidence).toBe(0.95);
      expect(results[0].dateTime.getUTCFullYear()).toBe(2025);
      expect(results[0].dateTime.getUTCMonth()).toBe(9); // October = 9
      expect(results[0].dateTime.getUTCDate()).toBe(8);
    });
  });

  describe('Year-only Patterns', () => {
    test('should correctly parse "Before YYYY"', () => {
      const results = extractor.extractDatesFromText('Before 2026', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].matchedText).toBe('Before 2026');
      expect(results[0].patternType).toBe('before_year');
      expect(results[0].confidence).toBe(0.85);
      expect(results[0].dateTime.getUTCFullYear()).toBe(2025); // Previous year
      expect(results[0].dateTime.getUTCMonth()).toBe(11); // December
      expect(results[0].dateTime.getUTCDate()).toBe(31); // Last day
    });

    test('should correctly parse "In YYYY"', () => {
      const results = extractor.extractDatesFromText('In 2026', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].matchedText).toBe('In 2026');
      expect(results[0].patternType).toBe('in_year');
      expect(results[0].confidence).toBe(0.85);
      expect(results[0].dateTime.getUTCFullYear()).toBe(2026);
      expect(results[0].dateTime.getUTCMonth()).toBe(11); // December
      expect(results[0].dateTime.getUTCDate()).toBe(31); // Last day
    });

    test('should correctly parse "By YYYY"', () => {
      const results = extractor.extractDatesFromText('By 2030', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].matchedText).toBe('By 2030');
      expect(results[0].patternType).toBe('by_year');
      expect(results[0].confidence).toBe(0.85);
      expect(results[0].dateTime.getUTCFullYear()).toBe(2029); // Previous year
    });
  });

  describe('Context-based Parsing', () => {
    test('should extract from event title and description', () => {
      const event = {
        title: 'Will X happen by December 2024?',
        description: 'This event resolves on January 1, 2025',
        slug: 'x-happen-2025-01-01'
      };

      const results = extractor.extractEventDates(event);

      expect(results.length).toBeGreaterThan(0);

      // Should find the ISO date from slug with highest confidence
      const slugMatch = results.find(r => r.source === 'slug' && r.patternType === 'iso_date');
      expect(slugMatch).toBeDefined();
      expect(slugMatch?.confidence).toBe(0.95);

      // Should have at least one match from any source
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases and Bug Fixes', () => {
    test('should NOT parse "December 2024" as "December 20, 25"', () => {
      const results = extractor.extractDatesFromText('December 2024', 'test');

      // Should only find the month_year pattern, not a false month_day_year pattern
      expect(results).toHaveLength(1);
      expect(results[0].patternType).toBe('month_year');
      expect(results[0].dateTime.getUTCFullYear()).toBe(2024);
      expect(results[0].dateTime.getUTCMonth()).toBe(11); // December
      expect(results[0].dateTime.getUTCDate()).toBe(31); // Last day of December

      // Ensure no incorrect parsing happened
      const incorrectMatch = results.find(r =>
        r.patternType === 'month_day_year' &&
        r.dateTime.getUTCFullYear() === 2025
      );
      expect(incorrectMatch).toBeUndefined();
    });

    test('should NOT parse year portion of "Month YYYY" as separate day', () => {
      const testCases = [
        'January 2024',
        'March 2025',
        'November 2026'
      ];

      testCases.forEach(testCase => {
        const results = extractor.extractDatesFromText(testCase, 'test');

        // Should only have one result (the month_year pattern)
        expect(results).toHaveLength(1);
        expect(results[0].patternType).toBe('month_year');

        // Should not have any erroneous month_day patterns
        const dayPatterns = results.filter(r =>
          r.patternType.includes('month_day')
        );
        expect(dayPatterns).toHaveLength(0);
      });
    });

    test('should handle complex text with multiple date patterns', () => {
      const text = 'Will something happen in December 2024? The event is scheduled for December 20, 2024 at 9:00 PM ET.';
      const results = extractor.extractDatesFromText(text, 'test');

      // Should find both patterns but deduplication should prefer the more specific one
      expect(results.length).toBeGreaterThan(0);

      // Check that we get the most specific date with highest confidence
      const bestMatch = results[0]; // Should be sorted by confidence
      expect(bestMatch.confidence).toBeGreaterThanOrEqual(0.9);
      expect(bestMatch.patternType).toMatch(/month_day_year/); // Could be with_time variant
    });
  });

  describe('Time and Timezone Handling', () => {
    test('should parse dates with time information', () => {
      const results = extractor.extractDatesFromText('September 2, 2025 at 3pm EDT', 'test');

      expect(results).toHaveLength(1);
      expect(results[0].patternType).toBe('month_day_year_with_time');
      expect(results[0].timeRange).toBe('3pm');
      expect(results[0].timezoneAbbr).toBe('EDT');
      expect(results[0].confidence).toBeGreaterThan(0.9);
    });

    test('should parse time ranges', () => {
      const results = extractor.extractDatesFromText('October 5, 9:00PM-9:15PM ET', 'test');

      // May have multiple matches, find the one with time range
      expect(results.length).toBeGreaterThan(0);
      const timeMatch = results.find(r => r.timeRange);
      expect(timeMatch).toBeDefined();
      expect(timeMatch?.timeRange).toBe('9:00PM-9:15PM');
      expect(timeMatch?.timezoneAbbr).toBe('ET');
    });
  });
});