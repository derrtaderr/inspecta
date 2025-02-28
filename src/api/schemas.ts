import { z } from 'zod';

/**
 * Schema for screenshot API request
 */
export const ScreenshotRequestSchema = z.object({
  url: z.string().url('A valid URL is required'),
  selector: z.string().optional(),
  fullPage: z.boolean().optional(),
  format: z.enum(['png', 'jpeg']).optional(),
  quality: z.number().min(1).max(100).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  waitForSelector: z.string().optional(),
  waitTime: z.number().nonnegative().optional(),
});

export type ScreenshotRequest = z.infer<typeof ScreenshotRequestSchema>;

/**
 * Schema for console log analysis request
 */
export const ConsoleLogRequestSchema = z.object({
  url: z.string().url('A valid URL is required'),
  timeoutMs: z.number().positive().optional(),
  navigationOptions: z.object({
    waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).optional(),
  }).optional(),
  filters: z.object({
    logLevel: z.enum(['debug', 'info', 'warning', 'error']).array().optional(),
    includePatterns: z.string().array().optional(),
    excludePatterns: z.string().array().optional(),
  }).optional(),
});

export type ConsoleLogRequest = z.infer<typeof ConsoleLogRequestSchema>;

/**
 * Network monitoring request schema
 */
export const NetworkMonitorRequestSchema = z.object({
  url: z.string().url(),
  timeoutMs: z.number().min(1000).max(60000).optional(),
  navigationOptions: z.object({
    waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).optional(),
  }).optional(),
  filters: z.object({
    methods: z.array(z.string()).optional(),
    resourceTypes: z.array(z.string()).optional(),
    statusCodes: z.array(z.number()).optional(),
    urlPatterns: z.array(z.string()).optional(),
    includeRequestBody: z.boolean().optional(),
    includeResponseBody: z.boolean().optional(),
    excludeUrlPatterns: z.array(z.string()).optional(),
  }).optional(),
});

export type NetworkMonitorRequest = z.infer<typeof NetworkMonitorRequestSchema>;

/**
 * DOM manipulator request schema
 */
export const DomManipulatorRequestSchema = z.object({
  url: z.string().url(),
  selector: z.string(),
  timeoutMs: z.number().min(1000).max(60000).optional(),
  // Optional fields for different operations
  stateType: z.enum(['exists', 'visible', 'enabled', 'checked', 'focused', 'selected']).optional(),
  actionType: z.enum(['click', 'type', 'select', 'clear', 'hover', 'focus', 'scrollIntoView']).optional(),
  actionValue: z.string().optional(),
  properties: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export type DomManipulatorRequest = z.infer<typeof DomManipulatorRequestSchema>; 