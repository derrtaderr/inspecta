import { z } from 'zod';
import { BaseTool } from '../BaseTool';
import { UIVerifier, UIVerificationOptions } from '../../analysis/image/UIVerifier';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parameters for text extraction operations
 */
export interface TextExtractionParams {
  url: string;
  selector?: string;
  textToFind?: string;
  ocrLanguage?: string;
  ocrConfidence?: number;
  fullPage?: boolean;
  waitForSelector?: string;
  waitForTimeout?: number;
}

/**
 * Result of text extraction operations
 */
export interface TextExtractionResult {
  success: boolean;
  error?: string;
  text?: string;
  confidence?: number;
  words?: Array<{
    text: string;
    confidence: number;
    boundingBox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

/**
 * MCP tool for image analysis and text extraction from web pages
 */
export class ImageAnalysisTool extends BaseTool<z.ZodType<TextExtractionParams>, TextExtractionResult> {
  private uiVerifier: UIVerifier;
  private tempDir: string;

  constructor() {
    // Define the parameters schema
    const paramsSchema = z.object({
      url: z.string().url(),
      selector: z.string().optional(),
      textToFind: z.string().optional(),
      ocrLanguage: z.string().optional(),
      ocrConfidence: z.number().min(0).max(1).optional(),
      fullPage: z.boolean().optional(),
      waitForSelector: z.string().optional(),
      waitForTimeout: z.number().positive().optional(),
    });

    // Define the response schema
    const responseSchema = z.object({
      success: z.boolean(),
      error: z.string().optional(),
      text: z.string().optional(),
      confidence: z.number().optional(),
      words: z.array(
        z.object({
          text: z.string(),
          confidence: z.number(),
          boundingBox: z.object({
            x0: z.number(),
            y0: z.number(),
            x1: z.number(),
            y1: z.number(),
          }),
        })
      ).optional(),
    });

    super(
      'extract_text_from_ui',
      'Extracts text from UI elements using OCR',
      paramsSchema,
      responseSchema
    );

    this.uiVerifier = new UIVerifier();
    this.tempDir = path.join(os.tmpdir(), 'inspecta-image-analysis-tool');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Execute the text extraction tool
   * @param params The parameters for text extraction
   * @returns A promise that resolves to the text extraction results
   */
  public async execute(params: TextExtractionParams): Promise<TextExtractionResult> {
    try {
      console.log(`[MCP Tool] Executing extract_text_from_ui for URL: ${params.url}`);
      
      const options: UIVerificationOptions = {
        ocrLanguage: params.ocrLanguage,
        ocrConfidence: params.ocrConfidence,
        fullPage: params.fullPage,
        waitForSelector: params.waitForSelector,
        waitForTimeout: params.waitForTimeout,
      };
      
      let result;
      
      // If textToFind is provided, use findTextInUI
      if (params.textToFind) {
        result = await this.uiVerifier.findTextInUI(
          params.url,
          params.textToFind,
          params.selector,
          options
        );
      } else {
        // Otherwise, just extract text
        result = await this.uiVerifier.extractTextFromUI(
          params.url,
          params.selector,
          options
        );
      }
      
      // Clean up temporary files
      this.uiVerifier.cleanup();
      
      if (!result.success || !result.textResults) {
        return {
          success: false,
          error: result.error || 'Failed to extract text'
        };
      }
      
      // Format the results
      const formattedResult: TextExtractionResult = {
        success: true,
        text: result.textResults.text,
        confidence: result.textResults.confidence,
        words: result.textResults.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          boundingBox: word.bbox
        }))
      };
      
      return formattedResult;
    } catch (error) {
      console.error('[MCP Tool] Error in extract_text_from_ui:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
} 