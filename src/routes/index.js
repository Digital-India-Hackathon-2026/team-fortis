import { Router } from 'express';
import authRoutes from './auth.routes.js';
import complaintRoutes from './complaint.routes.js';
import departmentRoutes from './department.routes.js';
import officerRoutes from './officer.routes.js';
import analyticsRoutes from './analytics.routes.js';
import searchRoutes from './search.routes.js';
import aiRoutes from './ai.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/departments', departmentRoutes);
router.use('/officers', officerRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/search', searchRoutes);
router.use('/ai', aiRoutes);

export default router;
