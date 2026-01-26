import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as autoHealer from './auto-healer';

describe('Auto-Healer Module', () => {
  describe('diagnoseSystem', () => {
    it('should return a valid diagnosis object', () => {
      const diagnosis = autoHealer.diagnoseSystem();
      
      expect(diagnosis).toBeDefined();
      expect(diagnosis.timestamp).toBeGreaterThan(0);
      expect(['healthy', 'warning', 'critical']).toContain(diagnosis.overallHealth);
      expect(Array.isArray(diagnosis.problems)).toBe(true);
      expect(Array.isArray(diagnosis.recommendations)).toBe(true);
      expect(diagnosis.metrics).toBeDefined();
      expect(typeof diagnosis.metrics.memoryUsagePercent).toBe('number');
      expect(typeof diagnosis.metrics.avgResponseTime).toBe('number');
      expect(typeof diagnosis.metrics.errorRate).toBe('number');
      expect(typeof diagnosis.metrics.activeAlerts).toBe('number');
    });
  });

  describe('investigateAndFix', () => {
    it('should return a valid healing result', () => {
      const result = autoHealer.investigateAndFix(false);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.actionsTaken)).toBe(true);
      expect(result.diagnosis).toBeDefined();
      expect(typeof result.message).toBe('string');
    });

    it('should include diagnosis in result', () => {
      const result = autoHealer.investigateAndFix(false);
      
      expect(result.diagnosis.timestamp).toBeGreaterThan(0);
      expect(result.diagnosis.metrics).toBeDefined();
    });
  });

  describe('executeManualAction', () => {
    it('should execute clear_cache action', () => {
      const action = autoHealer.executeManualAction('clear_cache');
      
      expect(action).toBeDefined();
      expect(action.actionType).toBe('clear_cache');
      expect(typeof action.success).toBe('boolean');
      expect(typeof action.description).toBe('string');
      expect(action.automatic).toBe(false);
    });

    it('should execute investigate action', () => {
      const action = autoHealer.executeManualAction('investigate');
      
      expect(action).toBeDefined();
      expect(action.actionType).toBe('investigate');
      expect(action.success).toBe(true);
      expect(action.description).toContain('Investigação');
    });

    it('should record memory before and after', () => {
      const action = autoHealer.executeManualAction('clear_cache');
      
      expect(typeof action.memoryBefore).toBe('number');
      expect(typeof action.memoryAfter).toBe('number');
    });
  });

  describe('getHealingHistory', () => {
    it('should return an array of healing actions', () => {
      // Execute an action to ensure history has at least one entry
      autoHealer.executeManualAction('investigate');
      
      const history = autoHealer.getHealingHistory(10);
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      const lastAction = history[0];
      expect(lastAction.id).toBeDefined();
      expect(lastAction.timestamp).toBeGreaterThan(0);
      expect(lastAction.actionType).toBeDefined();
    });

    it('should respect limit parameter', () => {
      // Execute multiple actions
      autoHealer.executeManualAction('investigate');
      autoHealer.executeManualAction('investigate');
      
      const history = autoHealer.getHealingHistory(1);
      
      expect(history.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getHealingStats', () => {
    it('should return valid statistics', () => {
      const stats = autoHealer.getHealingStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalActions).toBe('number');
      expect(typeof stats.successfulActions).toBe('number');
      expect(typeof stats.failedActions).toBe('number');
      expect(typeof stats.autoHealingEnabled).toBe('boolean');
      expect(typeof stats.actionsLast24h).toBe('number');
    });

    it('should have consistent counts', () => {
      const stats = autoHealer.getHealingStats();
      
      expect(stats.totalActions).toBe(stats.successfulActions + stats.failedActions);
    });
  });

  describe('getHealingConfig', () => {
    it('should return configuration object', () => {
      const config = autoHealer.getHealingConfig();
      
      expect(config).toBeDefined();
      expect(typeof config.memoryWarningThreshold).toBe('number');
      expect(typeof config.memoryCriticalThreshold).toBe('number');
      expect(typeof config.responseTimeWarningThreshold).toBe('number');
      expect(typeof config.autoHealingEnabled).toBe('boolean');
    });
  });

  describe('setAutoHealingEnabled', () => {
    it('should enable auto-healing', () => {
      autoHealer.setAutoHealingEnabled(true);
      const config = autoHealer.getHealingConfig();
      
      expect(config.autoHealingEnabled).toBe(true);
    });

    it('should disable auto-healing', () => {
      autoHealer.setAutoHealingEnabled(false);
      const config = autoHealer.getHealingConfig();
      
      expect(config.autoHealingEnabled).toBe(false);
      
      // Re-enable for other tests
      autoHealer.setAutoHealingEnabled(true);
    });
  });

  describe('updateHealingConfig', () => {
    it('should update configuration values', () => {
      const originalConfig = autoHealer.getHealingConfig();
      const newThreshold = 80;
      
      autoHealer.updateHealingConfig({ memoryWarningThreshold: newThreshold });
      const updatedConfig = autoHealer.getHealingConfig();
      
      expect(updatedConfig.memoryWarningThreshold).toBe(newThreshold);
      
      // Restore original value
      autoHealer.updateHealingConfig({ memoryWarningThreshold: originalConfig.memoryWarningThreshold });
    });
  });
});
