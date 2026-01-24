/**
 * Tests for Agent 1: Architecture Analysis Report
 *
 * Validates the architecture analysis document contains all required sections
 * and accurately documents the codebase structure.
 */

import * as fs from 'fs';
import * as path from 'path';

const ANALYSIS_PATH = path.join(__dirname, '..', 'agent1-architecture.md');

describe('Agent 1: Architecture Analysis Report', () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(ANALYSIS_PATH, 'utf-8');
  });

  describe('Document Structure', () => {
    it('should exist at the expected path', () => {
      expect(fs.existsSync(ANALYSIS_PATH)).toBe(true);
    });

    it('should contain Executive Summary section', () => {
      expect(content).toContain('## Executive Summary');
    });

    it('should contain Project Structure Overview section', () => {
      expect(content).toContain('## Project Structure Overview');
    });

    it('should contain Entry Points section', () => {
      expect(content).toContain('## Entry Points');
    });

    it('should contain State Management section', () => {
      expect(content).toContain('## State Management');
    });

    it('should contain Routing Structure section', () => {
      expect(content).toContain('## Routing Structure');
    });

    it('should contain Shared Utilities and Hooks section', () => {
      expect(content).toContain('## Shared Utilities and Hooks');
    });
  });

  describe('Technical Accuracy', () => {
    it('should document Expo SDK 55', () => {
      expect(content).toContain('Expo SDK 55');
    });

    it('should document React Native 0.83', () => {
      expect(content).toContain('React Native 0.83');
    });

    it('should document Zustand for state management', () => {
      expect(content).toContain('Zustand');
    });

    it('should document Expo Router for navigation', () => {
      expect(content).toContain('Expo Router');
    });

    it('should document the feature-first architecture pattern', () => {
      expect(content).toContain('feature-first');
      expect(content).toMatch(/feature.*architecture/i);
    });

    it('should document key features: wind, shot calculator, settings', () => {
      expect(content).toContain('wind');
      expect(content).toContain('calculator');
      expect(content).toContain('settings');
    });
  });

  describe('Required Entry Points Documentation', () => {
    it('should document app/_layout.tsx as root entry', () => {
      expect(content).toContain('app/_layout.tsx');
    });

    it('should document feature entry points', () => {
      expect(content).toContain('src/features/');
    });

    it('should document service entry points', () => {
      expect(content).toContain('src/services/');
    });
  });

  describe('State Management Documentation', () => {
    it('should document Zustand stores location', () => {
      expect(content).toContain('src/stores/');
    });

    it('should document subscription store', () => {
      expect(content).toContain('subscription');
    });

    it('should document navigation preference store', () => {
      expect(content).toContain('navigationPreference');
    });

    it('should document React Context providers', () => {
      expect(content).toContain('Context');
      expect(content).toContain('AppProvider');
    });
  });

  describe('Routing Documentation', () => {
    it('should document tabs-redesign route group', () => {
      expect(content).toContain('tabs-redesign');
    });

    it('should document the three main tabs', () => {
      expect(content).toContain('(setup)');
      expect(content).toContain('(shot)');
      expect(content).toContain('(wind)');
    });
  });

  describe('Utilities Documentation', () => {
    it('should document custom hooks', () => {
      expect(content).toContain('usePresets');
      expect(content).toContain('useUndoRedo');
    });

    it('should document utility modules', () => {
      expect(content).toContain('LogManager');
      expect(content).toContain('cacheManager');
    });
  });
});
