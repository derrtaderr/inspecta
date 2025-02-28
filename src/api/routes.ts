import { Router } from 'express';
import { screenshotController } from './screenshotController';
import { consoleLogController } from './consoleLogController';
import { networkMonitorController } from './networkMonitorController';
import { domManipulatorController } from './domManipulatorController';

const router = Router();

// Health check endpoint
router.get('/health', screenshotController.healthCheck);

// Screenshot endpoints
router.post('/screenshot', screenshotController.takeScreenshot);

// Console log analysis endpoints
router.post('/console-logs', consoleLogController.collectLogs);
router.get('/console-logs/health', consoleLogController.healthCheck);

// Network monitoring endpoints
router.post('/network', networkMonitorController.monitorNetwork);
router.get('/network/health', networkMonitorController.healthCheck);

// DOM manipulation endpoints
router.post('/dom/state', domManipulatorController.checkElementState);
router.post('/dom/properties', domManipulatorController.getElementProperties);
router.post('/dom/action', domManipulatorController.performElementAction);
router.post('/dom/find', domManipulatorController.findElements);
router.get('/dom/health', domManipulatorController.healthCheck);

export default router; 