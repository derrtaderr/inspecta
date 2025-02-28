/**
 * Application configuration settings
 */
export interface Config {
  server: {
    port: number;
    host: string;
  };
  browser: {
    headless: boolean;
    defaultViewport: {
      width: number;
      height: number;
    };
    timeout: number;
    maxInstances: number;
  };
  logging: {
    level: string;
    enableConsole: boolean;
  };
}

const config: Config = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    host: process.env.HOST || 'localhost',
  },
  browser: {
    headless: process.env.BROWSER_HEADLESS !== 'false',
    defaultViewport: {
      width: process.env.VIEWPORT_WIDTH ? parseInt(process.env.VIEWPORT_WIDTH, 10) : 1280,
      height: process.env.VIEWPORT_HEIGHT ? parseInt(process.env.VIEWPORT_HEIGHT, 10) : 800,
    },
    timeout: process.env.BROWSER_TIMEOUT ? parseInt(process.env.BROWSER_TIMEOUT, 10) : 30000,
    maxInstances: process.env.MAX_BROWSER_INSTANCES
      ? parseInt(process.env.MAX_BROWSER_INSTANCES, 10)
      : 5,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
  },
};

export default config; 