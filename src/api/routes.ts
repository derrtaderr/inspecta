import { Router } from 'express';
import { screenshotController } from './screenshotController';
import { consoleLogController } from './consoleLogController';
import { networkMonitorController } from './networkMonitorController';
import { domManipulatorController } from './domManipulatorController';
import imageAnalysisRoutes from './routes/imageAnalysis';
import authRoutes from './routes/auth';
import { authenticate } from '../middleware/security/authMiddleware';
import config from '../config/config';

const router = Router();

// Health check endpoint
router.get('/health', screenshotController.healthCheck);

// Authentication routes
router.use('/auth', authRoutes);

// CSP violation reports
router.post('/csp-report', (req, res) => {
  console.warn('CSP Violation:', req.body);
  res.status(204).end();
});

// Protected routes that require authentication if enabled
const protectedRoute = config.security.auth.enabled ? authenticate : (req, res, next) => next();

// Screenshot endpoints
router.post('/screenshot', protectedRoute, screenshotController.takeScreenshot);

// Console log analysis endpoints
router.post('/console-logs', protectedRoute, consoleLogController.collectLogs);
router.get('/console-logs/health', consoleLogController.healthCheck);

// Network monitoring endpoints
router.post('/network', protectedRoute, networkMonitorController.monitorNetwork);
router.get('/network/health', networkMonitorController.healthCheck);

// DOM manipulation endpoints
router.post('/dom/state', protectedRoute, domManipulatorController.checkElementState);
router.post('/dom/properties', protectedRoute, domManipulatorController.getElementProperties);
router.post('/dom/action', protectedRoute, domManipulatorController.performElementAction);
router.post('/dom/find', protectedRoute, domManipulatorController.findElements);
router.get('/dom/health', domManipulatorController.healthCheck);

// Image analysis endpoints
router.use('/image-analysis', protectedRoute, imageAnalysisRoutes);

export default router; 