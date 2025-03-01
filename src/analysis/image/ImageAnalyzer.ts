import Jimp from 'jimp';
import pixelmatch from 'pixelmatch';
import { createWorker } from 'tesseract.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Options for image analysis operations
 */
export interface ImageAnalysisOptions {
  threshold?: number;      // Threshold for image comparison (0-1)
  highlightColor?: number; // Color to highlight differences (RGBA hex)
  ocrLanguage?: string;    // Language for OCR (default: 'eng')
  ocrConfidence?: number;  // Minimum confidence for OCR results (0-1)
  tempDir?: string;        // Directory for temporary files
}

/**
 * Result of image comparison
 */
export interface ImageComparisonResult {
  matches: boolean;
  diffPercentage: number;
  diffCount: number;
  diffImageBuffer?: Buffer;
  diffImagePath?: string;
  width: number;
  height: number;
}

/**
 * Result of OCR text extraction
 */
export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

/**
 * Bounding box for image regions
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Core class for analyzing and comparing images
 */
export class ImageAnalyzer {
  private defaultOptions: ImageAnalysisOptions = {
    threshold: 0.1,
    highlightColor: 0xFF0000FF, // Red with full alpha
    ocrLanguage: 'eng',
    ocrConfidence: 0.7,
    tempDir: path.join(os.tmpdir(), 'inspecta-image-analysis')
  };

  private options: ImageAnalysisOptions;

  /**
   * Create a new ImageAnalyzer
   * @param options Options for image analysis
   */
  constructor(options: ImageAnalysisOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.options.tempDir!)) {
      fs.mkdirSync(this.options.tempDir!, { recursive: true });
    }
  }

  /**
   * Load an image from a file or buffer
   * @param source Path to image file or image buffer
   * @returns Promise resolving to Jimp image
   */
  public async loadImage(source: string | Buffer): Promise<Jimp> {
    try {
      if (typeof source === 'string') {
        return await Jimp.read(source);
      } else {
        return await Jimp.read(source);
      }
    } catch (error) {
      throw new Error(`Failed to load image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Compare two images and generate a diff image
   * @param image1 First image (file path, URL, or buffer)
   * @param image2 Second image (file path, URL, or buffer)
   * @param options Comparison options
   * @returns Promise resolving to comparison result
   */
  public async compareImages(
    image1: string | Buffer,
    image2: string | Buffer,
    options: ImageAnalysisOptions = {}
  ): Promise<ImageComparisonResult> {
    try {
      const mergedOptions = { ...this.options, ...options };
      
      // Load both images
      const [img1, img2] = await Promise.all([
        this.loadImage(image1),
        this.loadImage(image2)
      ]);
      
      // Ensure images have the same dimensions
      const width = img1.getWidth();
      const height = img1.getHeight();
      
      if (img2.getWidth() !== width || img2.getHeight() !== height) {
        img2.resize(width, height);
      }
      
      // Create diff image
      const diffImage = new Jimp(width, height);
      
      // Convert images to raw buffers for pixelmatch
      const img1Data = new Uint8Array(img1.bitmap.data);
      const img2Data = new Uint8Array(img2.bitmap.data);
      const diffData = new Uint8Array(diffImage.bitmap.data);
      
      // Compare images
      const diffCount = pixelmatch(
        img1Data,
        img2Data,
        diffData,
        width,
        height,
        {
          threshold: mergedOptions.threshold,
          alpha: 0.1,
          diffColor: mergedOptions.highlightColor
            ? [
                (mergedOptions.highlightColor >> 24) & 0xFF,
                (mergedOptions.highlightColor >> 16) & 0xFF,
                (mergedOptions.highlightColor >> 8) & 0xFF
              ]
            : undefined,
          diffMask: true
        }
      );
      
      // Calculate diff percentage
      const totalPixels = width * height;
      const diffPercentage = diffCount / totalPixels;
      
      // Create diff image file if there are differences
      let diffImageBuffer: Buffer | undefined;
      let diffImagePath: string | undefined;
      
      if (diffCount > 0) {
        diffImage.bitmap.data = Buffer.from(diffData);
        diffImageBuffer = await diffImage.getBufferAsync(Jimp.MIME_PNG);
        
        // Save diff image to temp file
        diffImagePath = path.join(this.options.tempDir!, `diff-${uuidv4()}.png`);
        await diffImage.writeAsync(diffImagePath);
      }
      
      return {
        matches: diffCount === 0,
        diffPercentage,
        diffCount,
        diffImageBuffer,
        diffImagePath,
        width,
        height
      };
    } catch (error) {
      throw new Error(`Image comparison failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract text from an image using OCR
   * @param image Image source (file path, URL, or buffer)
   * @param options OCR options
   * @returns Promise resolving to OCR result
   */
  public async extractText(
    image: string | Buffer,
    options: ImageAnalysisOptions = {}
  ): Promise<OCRResult> {
    try {
      const mergedOptions = { ...this.options, ...options };
      
      // Create temp file for image if buffer is provided
      let imagePath: string;
      
      if (Buffer.isBuffer(image)) {
        const img = await this.loadImage(image);
        imagePath = path.join(this.options.tempDir!, `ocr-${uuidv4()}.png`);
        await img.writeAsync(imagePath);
      } else {
        imagePath = image;
      }
      
      // Create Tesseract worker
      const worker = await createWorker(mergedOptions.ocrLanguage);
      
      // Recognize text
      const result = await worker.recognize(imagePath);
      
      // Clean up worker
      await worker.terminate();
      
      // Clean up temp file if created
      if (Buffer.isBuffer(image) && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      // Format results
      const words = result.data.words
        .filter(word => word.confidence >= (mergedOptions.ocrConfidence || 0))
        .map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        }));
      
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words
      };
    } catch (error) {
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Crop an image to a specific region
   * @param image Image source (file path, URL, or buffer)
   * @param box Bounding box for cropping
   * @returns Promise resolving to cropped image buffer
   */
  public async cropImage(
    image: string | Buffer,
    box: BoundingBox
  ): Promise<Buffer> {
    try {
      const img = await this.loadImage(image);
      
      // Crop image to bounding box
      const cropped = img.crop(box.x, box.y, box.width, box.height);
      
      // Return as buffer
      return await cropped.getBufferAsync(Jimp.MIME_PNG);
    } catch (error) {
      throw new Error(`Image cropping failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean up temporary files
   */
  public cleanup(): void {
    try {
      const tempDir = this.options.tempDir!;
      
      if (fs.existsSync(tempDir)) {
        // Read all files in temp directory
        const files = fs.readdirSync(tempDir);
        
        // Delete each file
        for (const file of files) {
          if (file.startsWith('diff-') || file.startsWith('ocr-')) {
            fs.unlinkSync(path.join(tempDir, file));
          }
        }
      }
    } catch (error) {
      console.error('Failed to clean up temporary files:', error);
    }
  }
} 