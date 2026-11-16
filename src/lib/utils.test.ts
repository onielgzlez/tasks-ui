import { describe, expect, it } from 'vitest';
import { formatDisplayDate, getInitials, getNextStatus, getStatusLabel, isOverdue } from './utils';

describe('utils', () => {
  describe('getNextStatus', () => {
    it('cycles through statuses properly', () => {
      expect(getNextStatus('pendiente')).toBe('en_curso');
      expect(getNextStatus('en_curso')).toBe('hecha');
      expect(getNextStatus('hecha')).toBe('pendiente');
    });
  });

  describe('getStatusLabel', () => {
    it('returns spanish human readable label', () => {
      expect(getStatusLabel('pendiente')).toBe('Pendiente');
      expect(getStatusLabel('en_curso')).toBe('En curso');
      expect(getStatusLabel('hecha')).toBe('Hecha');
    });
  });

  describe('getInitials', () => {
    it('extracts two characters for single words', () => {
      expect(getInitials('Ana')).toBe('AN');
    });

    it('extracts initials for multi-word names', () => {
      expect(getInitials('Santiago Perez')).toBe('SP');
    });

    it('handles empty names', () => {
      expect(getInitials('')).toBe('?');
    });
  });

  describe('formatDisplayDate', () => {
    it('formats YYYY-MM-DD properly', () => {
      const formatted = formatDisplayDate('2026-12-25');
      expect(formatted).toContain('25');
      expect(formatted).toContain('2026');
    });
  });

  describe('isOverdue', () => {
    it('returns false for completed tasks even if date is past', () => {
      expect(isOverdue('2020-01-01', 'hecha')).toBe(false);
    });

    it('returns true for past dates on pending tasks', () => {
      expect(isOverdue('2020-01-01', 'pendiente')).toBe(true);
    });

    it('returns false for far future dates', () => {
      expect(isOverdue('2099-01-01', 'pendiente')).toBe(false);
    });
  });
});
