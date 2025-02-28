import { NetworkMonitor, NetworkRequestEntry } from '../../src/analysis/NetworkMonitor';

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

describe('NetworkMonitor', () => {
  let networkMonitor: NetworkMonitor;
  
  beforeEach(() => {
    networkMonitor = new NetworkMonitor();
    jest.clearAllMocks();
  });
  
  describe('analyzeErrorPatterns', () => {
    it('should correctly count errors and group by status code', () => {
      // Arrange
      const requests: NetworkRequestEntry[] = [
        {
          id: '1',
          url: 'https://example.com/api/data',
          method: 'GET',
          resourceType: 'fetch',
          status: 200,
          statusText: 'OK',
          requestStatus: 'success',
          requestHeaders: {},
          responseHeaders: {},
          timing: {
            startTime: Date.now(),
            endTime: Date.now() + 100,
            duration: 100,
          },
          size: {
            request: 100,
            response: 1024,
          },
          redirectChain: [],
          isRedirect: false,
        },
        {
          id: '2',
          url: 'https://example.com/api/missing',
          method: 'GET',
          resourceType: 'fetch',
          status: 404,
          statusText: 'Not Found',
          requestStatus: 'error',
          requestHeaders: {},
          responseHeaders: {},
          timing: {
            startTime: Date.now(),
            endTime: Date.now() + 50,
            duration: 50,
          },
          size: {
            request: 100,
            response: 512,
          },
          redirectChain: [],
          isRedirect: false,
        },
        {
          id: '3',
          url: 'https://example.com/api/server-error',
          method: 'POST',
          resourceType: 'fetch',
          status: 500,
          statusText: 'Internal Server Error',
          requestStatus: 'error',
          requestHeaders: {},
          responseHeaders: {},
          timing: {
            startTime: Date.now(),
            endTime: Date.now() + 200,
            duration: 200,
          },
          size: {
            request: 200,
            response: 300,
          },
          redirectChain: [],
          isRedirect: false,
        },
        {
          id: '4',
          url: 'https://example.com/api/another-error',
          method: 'GET',
          resourceType: 'fetch',
          status: 500,
          statusText: 'Internal Server Error',
          requestStatus: 'error',
          requestHeaders: {},
          responseHeaders: {},
          timing: {
            startTime: Date.now(),
            endTime: Date.now() + 150,
            duration: 150,
          },
          size: {
            request: 100,
            response: 200,
          },
          redirectChain: [],
          isRedirect: false,
        },
      ];
      
      // Act
      const result = networkMonitor.analyzeErrorPatterns(requests);
      
      // Assert
      expect(result.errorCount).toBe(3);
      expect(result.errorByStatusCode[404]).toBe(1);
      expect(result.errorByStatusCode[500]).toBe(2);
      expect(result.slowestRequests.length).toBeGreaterThan(0);
      expect(result.commonErrorUrls.length).toBeGreaterThan(0);
    });
    
    it('should identify the slowest requests correctly', () => {
      // Arrange
      const requests: NetworkRequestEntry[] = [
        {
          id: '1',
          url: 'https://example.com/api/fast',
          method: 'GET',
          resourceType: 'fetch',
          status: 200,
          statusText: 'OK',
          requestStatus: 'success',
          requestHeaders: {},
          responseHeaders: {},
          timing: {
            startTime: Date.now(),
            endTime: Date.now() + 50,
            duration: 50,
          },
          size: {
            request: 100,
            response: 1024,
          },
          redirectChain: [],
          isRedirect: false,
        },
        {
          id: '2',
          url: 'https://example.com/api/slow',
          method: 'GET',
          resourceType: 'fetch',
          status: 200,
          statusText: 'OK',
          requestStatus: 'success',
          requestHeaders: {},
          responseHeaders: {},
          timing: {
            startTime: Date.now(),
            endTime: Date.now() + 500,
            duration: 500,
          },
          size: {
            request: 100,
            response: 512,
          },
          redirectChain: [],
          isRedirect: false,
        },
        {
          id: '3',
          url: 'https://example.com/api/medium',
          method: 'GET',
          resourceType: 'fetch',
          status: 200,
          statusText: 'OK',
          requestStatus: 'success',
          requestHeaders: {},
          responseHeaders: {},
          timing: {
            startTime: Date.now(),
            endTime: Date.now() + 250,
            duration: 250,
          },
          size: {
            request: 100,
            response: 512,
          },
          redirectChain: [],
          isRedirect: false,
        },
      ];
      
      // Act
      const result = networkMonitor.analyzeErrorPatterns(requests);
      
      // Assert
      expect(result.slowestRequests.length).toBe(3);
      expect(result.slowestRequests[0].url).toBe('https://example.com/api/slow');
      expect(result.slowestRequests[0].timing.duration).toBe(500);
      expect(result.slowestRequests[1].url).toBe('https://example.com/api/medium');
      expect(result.slowestRequests[2].url).toBe('https://example.com/api/fast');
    });
  });
}); 