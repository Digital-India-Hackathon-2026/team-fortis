import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller.js';
import { validate } from '../middlewares/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validations/schemas.js';

const router = Router();

router.post('/', validate(createDepartmentSchema), DepartmentController.create);
router.get('/', DepartmentController.getAll);
router.get('/:id', DepartmentController.getById);
router.put('/:id', validate(updateDepartmentSchema), DepartmentController.update);
router.delete('/:id', DepartmentController.delete);

export default router;
