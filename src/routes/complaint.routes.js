import { Router } from 'express';
import { ComplaintController } from '../controllers/complaint.controller.js';
import { validate } from '../middlewares/validate.js';
import { createComplaintSchema, updateComplaintStatusSchema, assignComplaintSchema } from '../validations/schemas.js';

const router = Router();

router.post('/', validate(createComplaintSchema), ComplaintController.create);
router.get('/', ComplaintController.getAll);
router.get('/:id', ComplaintController.getById);
router.patch('/:id/status', validate(updateComplaintStatusSchema), ComplaintController.updateStatus);
router.patch('/:id/assign', validate(assignComplaintSchema), ComplaintController.assign);

export default router;
