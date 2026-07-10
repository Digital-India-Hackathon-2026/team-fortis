import { Router } from 'express';
import { OfficerController } from '../controllers/officer.controller.js';
import { validate } from '../middlewares/validate.js';
import { createOfficerSchema, updateOfficerSchema } from '../validations/schemas.js';

const router = Router();

router.post('/', validate(createOfficerSchema), OfficerController.create);
router.get('/', OfficerController.getAll);
router.get('/:id', OfficerController.getById);
router.patch('/:id', validate(updateOfficerSchema), OfficerController.update);

export default router;
