export interface DateMatch {
  dateTime: Date;
  confidence: number;
  matchedText: string;
  source: string;
  patternType: string;
  timezoneAbbr?: string;
  timeRange?: string;
}

/**
 * Date extraction engine that ports the Python logic from extract_event_dates.py
 * Extracts dates from market questions and descriptions using regex patterns
 */
export class DateExtractor {
  private readonly currentYear = new Date().getFullYear();

  private readonly monthNames = {
    january: 1, february: 2, march: 3, april: 4,
    may: 5, june: 6, july: 7, august: 8,
    september: 9, october: 10, november: 11, december: 12,
    // Abbreviated forms
    jan: 1, feb: 2, mar: 3, apr: 4,
    jun: 6, jul: 7, aug: 8, sep: 9,
    oct: 10, nov: 11, dec: 12
  };

  private readonly timezoneMap = {
    'UTC': 'UTC',
    'GMT': 'UTC',
    'ET': 'America/New_York',
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    'PT': 'America/Los_Angeles',
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',
    'CT': 'America/Chicago',
    'CST': 'America/Chicago',
    'CDT': 'America/Chicago',
    'MT': 'America/Denver',
    'MST': 'America/Denver',
    'MDT': 'America/Denver',
    'AT': 'America/Halifax',
    'BT': 'America/Halifax'
  };

  /**
   * Extract dates from text using various regex patterns
   */
  extractDatesFromText(text: string, source: string): DateMatch[] {
    if (!text) {
      return [];
    }

    const matches: DateMatch[] = [];

    // Pattern 1: Enhanced to capture time and timezone, including date ranges
    // "October 5, 9:00PM-9:15PM ET" or "October 5, 2025" or "October 5 at 9:00PM ET"
    // "Aug 22-28, 2021" or "From Aug 22-28, 2021"
    // Also supports abbreviated months: "Sep 2, 2025 at 3pm EDT"
    const pattern1 = new RegExp(
      '(?:From\\s+)?\\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+' +
      '(\\d{1,2})(?:-(\\d{1,2}))?(?:,\\s*(\\d{4}))?' +
      '(?:\\s*,?\\s*(?:at\\s+)?(\\d{1,2}(?::\\d{2})?\\s*[AP]M(?:\\s*-\\s*\\d{1,2}:\\d{2}(?:\\s*[AP]M)?)?)\\s*' +
      '(?:(ET|PT|CT|MT|EST|PST|CST|MST|EDT|PDT|CDT|MDT|UTC|GMT|AT|BT))\\b)?',
      'gi'
    );

    for (const match of text.matchAll(pattern1)) {
      const monthName = match[1];
      const dayStartStr = match[2];
      const dayEndStr = match[3]; // Capture the end day for ranges like "22-28"
      const yearStr = match[4];
      const timePart = match[5];
      const timezonePart = match[6];

      if (!monthName || !dayStartStr) continue;

      try {
        const month = this.monthNames[monthName.toLowerCase() as keyof typeof this.monthNames];
        if (!month) continue;

        // Use end day if it's a range, otherwise use start day
        const day = dayEndStr ? parseInt(dayEndStr) : parseInt(dayStartStr);
        const year = yearStr ? parseInt(yearStr) : this.currentYear;

        // Parse time if available - use end time for ranges
        let { hour, minute } = this.parseTimeString(timePart || '0:00', true); // true for preferEndTime

        // Create datetime with parsed time in UTC
        let dateTime = new Date(Date.UTC(year, month - 1, day, hour, minute));

        // Apply timezone conversion
        if (timezonePart) {
          dateTime = this.applyTimezone(dateTime, timezonePart);
        }

        // Confidence based on specificity
        let confidence = yearStr ? 0.9 : 0.8; // Higher if year is specified
        if (timePart) confidence += 0.05; // Bonus for having time
        if (timezonePart) confidence += 0.05; // Bonus for having timezone
        if (dayEndStr) confidence += 0.05; // Bonus for date range

        const patternTypeBase = dayEndStr ? "month_day_range" : "month_day_year";
        const patternType = timePart ? `${patternTypeBase}_with_time` : patternTypeBase;

        const dateMatch: DateMatch = {
          dateTime,
          confidence: Math.min(confidence, 1.0),
          matchedText: match[0],
          source,
          patternType
        };

        if (timezonePart) {
          dateMatch.timezoneAbbr = timezonePart.toUpperCase();
        }
        if (timePart) {
          dateMatch.timeRange = timePart;
        }

        matches.push(dateMatch);
      } catch (error) {
        continue;
      }
    }

    // Pattern 2: ISO date format "2025-10-08"
    const pattern2 = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g;

    for (const match of text.matchAll(pattern2)) {
      const yearStr = match[1];
      const monthStr = match[2];
      const dayStr = match[3];

      if (!yearStr || !monthStr || !dayStr) continue;

      try {
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const day = parseInt(dayStr);
        const dateTime = new Date(Date.UTC(year, month - 1, day));

        matches.push({
          dateTime,
          confidence: 0.95,
          matchedText: match[0],
          source,
          patternType: "iso_date"
        });
      } catch (error) {
        continue;
      }
    }

    // Pattern 3: "MM/DD/YYYY" or "DD/MM/YYYY" format
    const pattern3 = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;

    for (const match of text.matchAll(pattern3)) {
      const part1Str = match[1];
      const part2Str = match[2];
      const yearStr = match[3];

      if (!part1Str || !part2Str || !yearStr) continue;

      const part1 = parseInt(part1Str);
      const part2 = parseInt(part2Str);
      const year = parseInt(yearStr);

      // Assume MM/DD/YYYY format for US markets
      try {
        const dateTime = new Date(Date.UTC(year, part1 - 1, part2));

        matches.push({
          dateTime,
          confidence: 0.7,
          matchedText: match[0],
          source,
          patternType: "slash_date_mdy"
        });
      } catch (error) {
        // Try DD/MM/YYYY if MM/DD/YYYY fails
        try {
          const dateTime = new Date(Date.UTC(year, part2 - 1, part1));

          matches.push({
            dateTime,
            confidence: 0.6,
            matchedText: match[0],
            source,
            patternType: "slash_date_dmy"
          });
        } catch (error) {
          continue;
        }
      }
    }

    // Pattern 4: "October 31" (current or next year) with optional time/timezone, including date ranges
    const pattern4 = new RegExp(
      '(?:From\\s+)?\\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+' +
      '(\\d{1,2})(?:-(\\d{1,2}))?\\b(?!\\s*,\\s*\\d{4})' + // Negative lookahead to avoid matching pattern1
      '(?:\\s*,?\\s*(?:at\\s+)?(\\d{1,2}(?::\\d{2})?\\s*[AP]M(?:\\s*-\\s*\\d{1,2}:\\d{2}(?:\\s*[AP]M)?)?)\\s*' +
      '(?:(ET|PT|CT|MT|EST|PST|CST|MST|EDT|PDT|CDT|MDT|UTC|GMT|AT|BT))\\b)?',
      'gi'
    );

    for (const match of text.matchAll(pattern4)) {
      const monthName = match[1];
      const dayStartStr = match[2];
      const dayEndStr = match[3]; // Capture the end day for ranges like "22-28"
      const timePart = match[4];
      const timezonePart = match[5];

      if (!monthName || !dayStartStr) continue;

      try {
        const month = this.monthNames[monthName.toLowerCase() as keyof typeof this.monthNames];
        if (!month) continue;

        // Use end day if it's a range, otherwise use start day
        const day = dayEndStr ? parseInt(dayEndStr) : parseInt(dayStartStr);

        // Parse time if available - use end time for ranges
        let { hour, minute } = this.parseTimeString(timePart || '0:00', !!dayEndStr);

        // Use current year, but if the date has passed, use next year
        let year = this.currentYear;
        let dateTime = new Date(Date.UTC(year, month - 1, day, hour, minute));

        // Apply timezone for comparison
        if (timezonePart) {
          dateTime = this.applyTimezone(dateTime, timezonePart);
        }

        // If the datetime has passed, use next year
        if (dateTime < new Date()) {
          year += 1;
          dateTime = new Date(Date.UTC(year, month - 1, day, hour, minute));
          if (timezonePart) {
            dateTime = this.applyTimezone(dateTime, timezonePart);
          }
        }

        // Confidence based on specificity
        let confidence = 0.7; // Medium confidence without year
        if (timePart) confidence += 0.05; // Bonus for having time
        if (timezonePart) confidence += 0.05; // Bonus for having timezone
        if (dayEndStr) confidence += 0.05; // Bonus for date range

        const patternTypeBase = dayEndStr ? "month_day_range_inferred_year" : "month_day_inferred_year";
        const patternType = timePart ? `${patternTypeBase}_with_time` : patternTypeBase;

        const dateMatch: DateMatch = {
          dateTime,
          confidence: Math.min(confidence, 1.0),
          matchedText: match[0],
          source,
          patternType
        };

        if (timezonePart) {
          dateMatch.timezoneAbbr = timezonePart.toUpperCase();
        }
        if (timePart) {
          dateMatch.timeRange = timePart;
        }

        matches.push(dateMatch);
      } catch (error) {
        continue;
      }
    }

    // Pattern 5: "Before YYYY" - resolves to last day/minute of previous year
    // "Before 2026" -> Dec 31, 2025 11:59 PM
    const pattern5 = /\bBefore\s+(\d{4})\b/gi;

    for (const match of text.matchAll(pattern5)) {
      const yearStr = match[1];

      if (!yearStr) continue;

      try {
        const targetYear = parseInt(yearStr);
        const previousYear = targetYear - 1;

        // Last minute of previous year (Dec 31, 11:59 PM UTC)
        const dateTime = new Date(Date.UTC(previousYear, 11, 31, 23, 59, 59));

        matches.push({
          dateTime,
          confidence: 0.85,
          matchedText: match[0],
          source,
          patternType: "before_year"
        });
      } catch (error) {
        continue;
      }
    }

    // Pattern 6: "In YYYY" - resolves to last day/minute of that year
    // "In 2026" -> Dec 31, 2026 11:59 PM
    const pattern6 = /\bIn\s+(\d{4})\b/gi;

    for (const match of text.matchAll(pattern6)) {
      const yearStr = match[1];

      if (!yearStr) continue;

      try {
        const year = parseInt(yearStr);

        // Last minute of the year (Dec 31, 11:59 PM UTC)
        const dateTime = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

        matches.push({
          dateTime,
          confidence: 0.85,
          matchedText: match[0],
          source,
          patternType: "in_year"
        });
      } catch (error) {
        continue;
      }
    }

    // Pattern 7: "By YYYY" - resolves to last day/minute of previous year (same as Before)
    // "By 2030" -> Dec 31, 2029 11:59 PM
    const pattern7 = /\bBy\s+(\d{4})\b/gi;

    for (const match of text.matchAll(pattern7)) {
      const yearStr = match[1];

      if (!yearStr) continue;

      try {
        const targetYear = parseInt(yearStr);
        const previousYear = targetYear - 1;

        // Last minute of previous year (Dec 31, 11:59 PM UTC)
        const dateTime = new Date(Date.UTC(previousYear, 11, 31, 23, 59, 59));

        matches.push({
          dateTime,
          confidence: 0.85,
          matchedText: match[0],
          source,
          patternType: "by_year"
        });
      } catch (error) {
        continue;
      }
    }

    // Remove duplicates (same date from different patterns)
    return this.removeDuplicates(matches);
  }

  /**
   * Parse time string like '12:45PM', '8PM', '9:00AM' to { hour, minute } in 24-hour format
   */
  private parseTimeString(timeStr: string, preferEndTime: boolean = false): { hour: number; minute: number } {
    if (!timeStr) {
      return { hour: 0, minute: 0 };
    }

    // Clean the string
    timeStr = timeStr.trim().toUpperCase();

    // Handle time ranges - take the end time if preferEndTime is true
    if (timeStr.includes('-')) {
      const parts = timeStr.split('-');
      if (preferEndTime && parts[1]) {
        timeStr = parts[1].trim();
      } else if (parts[0]) {
        timeStr = parts[0].trim();
      }
    }

    // Check for AM/PM
    const isPM = timeStr.includes('PM');
    const isAM = timeStr.includes('AM');

    // Remove AM/PM
    timeStr = timeStr.replace('AM', '').replace('PM', '').trim();

    // Parse hour and minute
    let hour: number;
    let minute: number;

    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      hour = parseInt(parts[0] || '0');
      minute = parseInt(parts[1] || '0');
    } else {
      // Just hour, no minutes
      hour = parseInt(timeStr) || 0;
      minute = 0;
    }

    // Convert to 24-hour format
    if (isPM && hour !== 12) {
      hour += 12;
    } else if (isAM && hour === 12) {
      hour = 0;
    }

    return { hour, minute };
  }

  /**
   * Apply timezone conversion to date
   */
  private applyTimezone(date: Date, tzAbbr: string): Date {
    // For now, we'll just return the date as-is since JavaScript Date handling
    // of timezones is complex. In production, you might want to use a library like date-fns-tz
    // This is a simplified version that assumes UTC
    return date;
  }

  /**
   * Remove duplicate dates, preferring matches with higher confidence
   */
  private removeDuplicates(matches: DateMatch[]): DateMatch[] {
    const uniqueMatches: DateMatch[] = [];
    const seenDates = new Set<string>();

    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);

    for (const match of matches) {
      const dateKey = match.dateTime.toDateString();
      if (!seenDates.has(dateKey)) {
        uniqueMatches.push(match);
        seenDates.add(dateKey);
      }
    }

    return uniqueMatches;
  }

  /**
   * Extract dates from a market event's title and description
   */
  extractEventDates(event: { title?: string; description?: string; slug?: string }): DateMatch[] {
    const allMatches: DateMatch[] = [];

    // Extract from title
    if (event.title) {
      const titleMatches = this.extractDatesFromText(event.title, 'title');
      allMatches.push(...titleMatches);
    }

    // Extract from description
    if (event.description) {
      const descriptionMatches = this.extractDatesFromText(event.description, 'description');
      allMatches.push(...descriptionMatches);
    }

    // Extract from slug (often has format like "fif-mex-col-2025-10-11")
    if (event.slug) {
      const slugMatches = this.extractDatesFromText(event.slug, 'slug');
      allMatches.push(...slugMatches);
    }

    // Deduplicate by date, preferring matches with time information
    return this.deduplicateByPreference(allMatches);
  }

  /**
   * Deduplicate matches by date, preferring those with time information
   */
  private deduplicateByPreference(matches: DateMatch[]): DateMatch[] {
    const dateMatches = new Map<string, DateMatch>();

    for (const match of matches) {
      const dateKey = match.dateTime.toDateString();

      if (!dateMatches.has(dateKey)) {
        dateMatches.set(dateKey, match);
      } else {
        const existing = dateMatches.get(dateKey);
        if (!existing) continue;

        // Prefer matches with time information over those without
        if (match.timeRange && !existing.timeRange) {
          // New match has time, existing doesn't - prefer new match
          dateMatches.set(dateKey, match);
        } else if (existing.timeRange && !match.timeRange) {
          // Existing has time, new doesn't - keep existing
          continue;
        } else if (match.confidence > existing.confidence) {
          // Both have time or both don't have time - use confidence
          dateMatches.set(dateKey, match);
        }
      }
    }

    return Array.from(dateMatches.values());
  }
}