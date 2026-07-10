import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/summary', AnalyticsController.getSummary);
router.get('/departments', AnalyticsController.getDepartments);
router.get('/trends', AnalyticsController.getTrends);

export default router;
