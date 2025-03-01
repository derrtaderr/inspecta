import express from 'express';
import { UIVerifier } from '../../analysis/image/UIVerifier';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Create router
const router = express.Router();

// Set up temporary file storage for file uploads
const tempDir = path.join(os.tmpdir(), 'inspecta-uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, tempDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${ext}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed.'));
    }
  }
});

/**
 * @route POST /api/image-analysis/compare
 * @description Compare a web page or element with a reference image
 * @access Public
 */
router.post('/compare', upload.single('referenceImage'), async (req, res) => {
  try {
    // Check if reference image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No reference image provided'
      });
    }
    
    // Get request body parameters
    const {
      url,
      selector,
      threshold = 0.1,
      fullPage = false,
      waitForSelector,
      waitForTimeout
    } = req.body;
    
    // Validate required parameters
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    // Create UI verifier
    const uiVerifier = new UIVerifier();
    
    // Perform comparison
    const result = await uiVerifier.compareWithReference(
      url,
      req.file.path,
      selector,
      {
        threshold: parseFloat(threshold),
        fullPage: fullPage === 'true' || fullPage === true,
        waitForSelector,
        waitForTimeout: waitForTimeout ? parseInt(waitForTimeout) : undefined
      }
    );
    
    // Clean up temporary files
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // If diff image exists, convert it to base64 to send in response
    let diffImageBase64;
    if (result.comparison?.diffImageBuffer) {
      diffImageBase64 = result.comparison.diffImageBuffer.toString('base64');
    }
    
    // Send response
    res.json({
      ...result,
      diffImageBase64,
      // Remove file paths from response to avoid exposing server paths
      comparison: result.comparison ? {
        ...result.comparison,
        diffImagePath: undefined,
      } : undefined,
      screenshotPath: undefined,
      referenceScreenshotPath: undefined
    });
  } catch (error) {
    console.error('Error in image comparison:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * @route POST /api/image-analysis/extract-text
 * @description Extract text from a web page or element using OCR
 * @access Public
 */
router.post('/extract-text', async (req, res) => {
  try {
    // Get request body parameters
    const {
      url,
      selector,
      ocrLanguage = 'eng',
      ocrConfidence = 0.7,
      fullPage = false,
      waitForSelector,
      waitForTimeout
    } = req.body;
    
    // Validate required parameters
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    // Create UI verifier
    const uiVerifier = new UIVerifier();
    
    // Extract text
    const result = await uiVerifier.extractTextFromUI(
      url,
      selector,
      {
        ocrLanguage,
        ocrConfidence: parseFloat(ocrConfidence),
        fullPage: fullPage === 'true' || fullPage === true,
        waitForSelector,
        waitForTimeout: waitForTimeout ? parseInt(waitForTimeout) : undefined
      }
    );
    
    // Send response
    res.json({
      ...result,
      // Remove file paths from response to avoid exposing server paths
      screenshotPath: undefined
    });
  } catch (error) {
    console.error('Error in text extraction:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * @route POST /api/image-analysis/find-text
 * @description Check if text is present in a web page or element using OCR
 * @access Public
 */
router.post('/find-text', async (req, res) => {
  try {
    // Get request body parameters
    const {
      url,
      textToFind,
      selector,
      ocrLanguage = 'eng',
      ocrConfidence = 0.7,
      fullPage = false,
      waitForSelector,
      waitForTimeout
    } = req.body;
    
    // Validate required parameters
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    if (!textToFind) {
      return res.status(400).json({
        success: false,
        error: 'Text to find is required'
      });
    }
    
    // Create UI verifier
    const uiVerifier = new UIVerifier();
    
    // Find text
    const result = await uiVerifier.findTextInUI(
      url,
      textToFind,
      selector,
      {
        ocrLanguage,
        ocrConfidence: parseFloat(ocrConfidence),
        fullPage: fullPage === 'true' || fullPage === true,
        waitForSelector,
        waitForTimeout: waitForTimeout ? parseInt(waitForTimeout) : undefined
      }
    );
    
    // Send response
    res.json({
      ...result,
      // Remove file paths from response to avoid exposing server paths
      screenshotPath: undefined
    });
  } catch (error) {
    console.error('Error in text search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

export default router; 