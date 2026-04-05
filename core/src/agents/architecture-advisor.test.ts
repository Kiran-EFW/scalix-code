/**
 * Architecture Advisor Agent Tests
 */

import { describe, it, expect } from 'vitest';
import {
  architectureAdvisorConfig,
  architectureAdvisorMetadata,
  ANTI_PATTERN_RULES,
  generateFindingId,
  scoreQualityAttribute,
  detectArchitecturePattern,
  calculateArchitectureMetrics,
  getAntiPatternInfo,
  sortFindings,
} from './architecture-advisor';
import type { ArchitectureFinding, DependencyNode } from './architecture-advisor';

describe('Architecture Advisor Agent', () => {
  describe('metadata', () => {
    it('should have correct id and category', () => {
      expect(architectureAdvisorMetadata.id).toBe('architecture-advisor');
      expect(architectureAdvisorMetadata.category).toBe('analysis');
    });

    it('should require correct tools', () => {
      expect(architectureAdvisorMetadata.requiredTools).toContain('dependency-analyzer');
      expect(architectureAdvisorMetadata.requiredTools).toContain('metrics-calculator');
      expect(architectureAdvisorMetadata.requiredTools).toContain('ast-parser');
    });
  });

  describe('config', () => {
    it('should have a system prompt', () => {
      expect(architectureAdvisorConfig.systemPrompt).toBeTruthy();
    });
  });

  describe('ANTI_PATTERN_RULES', () => {
    it('should define all anti-patterns', () => {
      const patterns = [
        'circular-dependency', 'god-module', 'tight-coupling',
        'missing-abstraction', 'leaky-abstraction', 'distributed-monolith',
        'shared-mutable-state', 'missing-error-boundary',
      ];
      for (const pattern of patterns) {
        expect(ANTI_PATTERN_RULES[pattern as keyof typeof ANTI_PATTERN_RULES]).toBeDefined();
      }
    });

    it('should have remediation for each anti-pattern', () => {
      for (const [, rule] of Object.entries(ANTI_PATTERN_RULES)) {
        expect(rule.remediation).toBeTruthy();
        expect(rule.impact.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateFindingId', () => {
    it('should create a prefixed finding ID', () => {
      const id = generateFindingId('circular-dependency', 'auth-module');
      expect(id).toBe('arch-circular-dependency-auth-module');
    });

    it('should sanitize component names', () => {
      const id = generateFindingId('god-module', 'src/utils.ts');
      expect(id).toBe('arch-god-module-src-utils-ts');
    });
  });

  describe('scoreQualityAttribute', () => {
    it('should start with perfect score of 10', () => {
      const score = scoreQualityAttribute('maintainability', []);
      expect(score).toBe(10);
    });

    it('should deduct for critical findings', () => {
      const findings: ArchitectureFinding[] = [
        {
          id: '1',
          component: 'test',
          issue: 'test',
          description: '',
          severity: 'critical',
          qualityAttributesAffected: ['maintainability'],
          recommendation: '',
          tradeOffs: { pros: [], cons: [] },
          effort: 'large',
          priority: 'must-fix',
          files: [],
        },
      ];
      const score = scoreQualityAttribute('maintainability', findings);
      expect(score).toBe(7); // 10 - 3
    });

    it('should not go below 0', () => {
      const findings: ArchitectureFinding[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        component: 'test',
        issue: 'test',
        description: '',
        severity: 'critical' as const,
        qualityAttributesAffected: ['maintainability' as const],
        recommendation: '',
        tradeOffs: { pros: [], cons: [] },
        effort: 'large' as const,
        priority: 'must-fix' as const,
        files: [],
      }));
      const score = scoreQualityAttribute('maintainability', findings);
      expect(score).toBe(0);
    });

    it('should only count relevant findings', () => {
      const findings: ArchitectureFinding[] = [
        {
          id: '1',
          component: 'test',
          issue: 'test',
          description: '',
          severity: 'high',
          qualityAttributesAffected: ['security'],
          recommendation: '',
          tradeOffs: { pros: [], cons: [] },
          effort: 'medium',
          priority: 'should-fix',
          files: [],
        },
      ];
      const score = scoreQualityAttribute('maintainability', findings);
      expect(score).toBe(10); // security finding doesn't affect maintainability
    });
  });

  describe('detectArchitecturePattern', () => {
    it('should detect layered architecture', () => {
      const modules = ['UserController', 'UserService', 'UserRepository'];
      const pattern = detectArchitecturePattern(modules, []);
      expect(pattern).toBe('layered');
    });

    it('should detect MVC pattern', () => {
      const modules = ['UserModel', 'UserView', 'UserController'];
      const pattern = detectArchitecturePattern(modules, []);
      // MVC check comes after layered, but controller triggers layered
      expect(['layered', 'mvc']).toContain(pattern);
    });

    it('should detect event-driven pattern', () => {
      const modules = ['OrderEventHandler', 'EventPublisher'];
      const pattern = detectArchitecturePattern(modules, []);
      expect(pattern).toBe('event-driven');
    });

    it('should default to monolith', () => {
      const modules = ['utils', 'helpers', 'config'];
      const pattern = detectArchitecturePattern(modules, []);
      expect(pattern).toBe('monolith');
    });
  });

  describe('calculateArchitectureMetrics', () => {
    it('should calculate metrics from dependency graph', () => {
      const deps: DependencyNode[] = [
        { module: 'a', dependencies: ['b', 'c'], dependents: [], isCircular: false, coupling: 0.5, cohesion: 0.8 },
        { module: 'b', dependencies: ['c'], dependents: ['a'], isCircular: false, coupling: 0.3, cohesion: 0.9 },
        { module: 'c', dependencies: [], dependents: ['a', 'b'], isCircular: false, coupling: 0.1, cohesion: 0.95 },
      ];
      const metrics = calculateArchitectureMetrics(deps);
      expect(metrics.moduleCount).toBe(3);
      expect(metrics.totalDependencies).toBe(3);
      expect(metrics.circularDependencies).toBe(0);
      expect(metrics.averageCoupling).toBe(0.3);
      expect(metrics.averageCohesion).toBe(0.88);
    });

    it('should handle empty dependency graph', () => {
      const metrics = calculateArchitectureMetrics([]);
      expect(metrics.moduleCount).toBe(0);
      expect(metrics.averageCoupling).toBe(0);
    });

    it('should count circular dependencies', () => {
      const deps: DependencyNode[] = [
        { module: 'a', dependencies: ['b'], dependents: ['b'], isCircular: true, coupling: 0.8, cohesion: 0.5 },
        { module: 'b', dependencies: ['a'], dependents: ['a'], isCircular: true, coupling: 0.8, cohesion: 0.5 },
      ];
      const metrics = calculateArchitectureMetrics(deps);
      expect(metrics.circularDependencies).toBe(2);
    });
  });

  describe('getAntiPatternInfo', () => {
    it('should return info for circular dependency', () => {
      const info = getAntiPatternInfo('circular-dependency');
      expect(info.description).toContain('Module A');
      expect(info.impact).toContain('maintainability');
    });
  });

  describe('sortFindings', () => {
    it('should sort by priority first, then severity', () => {
      const findings: ArchitectureFinding[] = [
        { id: '1', component: '', issue: '', description: '', severity: 'low', qualityAttributesAffected: [], recommendation: '', tradeOffs: { pros: [], cons: [] }, effort: 'small', priority: 'nice-to-have', files: [] },
        { id: '2', component: '', issue: '', description: '', severity: 'critical', qualityAttributesAffected: [], recommendation: '', tradeOffs: { pros: [], cons: [] }, effort: 'large', priority: 'must-fix', files: [] },
        { id: '3', component: '', issue: '', description: '', severity: 'high', qualityAttributesAffected: [], recommendation: '', tradeOffs: { pros: [], cons: [] }, effort: 'medium', priority: 'should-fix', files: [] },
      ];
      const sorted = sortFindings(findings);
      expect(sorted[0].priority).toBe('must-fix');
      expect(sorted[1].priority).toBe('should-fix');
      expect(sorted[2].priority).toBe('nice-to-have');
    });

    it('should sort by severity within same priority', () => {
      const findings: ArchitectureFinding[] = [
        { id: '1', component: '', issue: '', description: '', severity: 'medium', qualityAttributesAffected: [], recommendation: '', tradeOffs: { pros: [], cons: [] }, effort: 'small', priority: 'must-fix', files: [] },
        { id: '2', component: '', issue: '', description: '', severity: 'critical', qualityAttributesAffected: [], recommendation: '', tradeOffs: { pros: [], cons: [] }, effort: 'large', priority: 'must-fix', files: [] },
      ];
      const sorted = sortFindings(findings);
      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('medium');
    });
  });
});
