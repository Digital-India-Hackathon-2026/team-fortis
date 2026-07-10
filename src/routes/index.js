import { Router } from 'express';
import authRoutes from './auth.routes.js';
import complaintRoutes from './complaint.routes.js';
import departmentRoutes from './department.routes.js';
import officerRoutes from './officer.routes.js';
import analyticsRoutes from './analytics.routes.js';
import searchRoutes from './search.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/departments', departmentRoutes);
router.use('/officers', officerRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/search', searchRoutes);

export default router;
