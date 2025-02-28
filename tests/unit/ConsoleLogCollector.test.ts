import { ConsoleLogCollector, ConsoleLogEntry } from '../../src/analysis/ConsoleLogCollector';

// Mock dependencies
jest.mock('../../src/browser/BrowserPool', () => {
  return {
    BrowserPool: {
      getInstance: jest.fn().mockReturnValue({
        getPage: jest.fn().mockResolvedValue({
          evaluate: jest.fn().mockImplementation((fn, arg) => {
            return new Promise((resolve) => setTimeout(resolve, 10));
          }),
          on: jest.fn(),
          url: jest.fn().mockReturnValue('https://example.com'),
        }),
        closePage: jest.fn().mockResolvedValue(undefined),
      }),
    },
  };
});

jest.mock('../../src/browser/PageUtils', () => {
  return {
    PageUtils: {
      navigateToUrl: jest.fn().mockResolvedValue(true),
    },
  };
});

describe('ConsoleLogCollector', () => {
  let consoleLogCollector: ConsoleLogCollector;
  
  beforeEach(() => {
    consoleLogCollector = new ConsoleLogCollector();
    jest.clearAllMocks();
  });
  
  describe('analyzeErrorPatterns', () => {
    it('should correctly count errors and warnings', () => {
      // Arrange
      const logs: ConsoleLogEntry[] = [
        {
          level: 'error',
          message: 'Error 1',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
        {
          level: 'warning',
          message: 'Warning 1',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
        {
          level: 'error',
          message: 'Error 2',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
        {
          level: 'info',
          message: 'Info message',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
        {
          level: 'warning',
          message: 'Warning 2',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
      ];
      
      // Act
      const result = consoleLogCollector.analyzeErrorPatterns(logs);
      
      // Assert
      expect(result.errorCount).toBe(2);
      expect(result.warningCount).toBe(2);
      expect(result.commonErrors).toHaveLength(2);
    });
    
    it('should identify common error patterns', () => {
      // Arrange
      const logs: ConsoleLogEntry[] = [
        {
          level: 'error',
          message: 'Cannot read property "foo" of undefined',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
        {
          level: 'error',
          message: 'Cannot read property "bar" of undefined',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
        {
          level: 'error',
          message: 'Uncaught TypeError: undefined is not a function',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
        {
          level: 'error',
          message: 'Failed to load resource: the server responded with a status of 404',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
        {
          level: 'error',
          message: 'Failed to load resource: the server responded with a status of 404',
          timestamp: Date.now(),
          url: 'https://example.com',
        },
      ];
      
      // Act
      const result = consoleLogCollector.analyzeErrorPatterns(logs);
      
      // Assert
      expect(result.errorCount).toBe(5);
      expect(result.commonErrors[0].count).toBe(2); // The most common error should have count 2
    });
  });
}); 