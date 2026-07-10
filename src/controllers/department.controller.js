import { DepartmentService } from '../services/department.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class DepartmentController {
  static async create(req, res, next) {
    try {
      const department = await DepartmentService.createDepartment(req.body);
      res.status(201).json(new ApiResponse(201, department, 'Department created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const departments = await DepartmentService.getAllDepartments();
      res.status(200).json(new ApiResponse(200, departments, 'Departments retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const department = await DepartmentService.getDepartmentById(req.params.id);
      res.status(200).json(new ApiResponse(200, department, 'Department details retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const department = await DepartmentService.updateDepartment(req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, department, 'Department updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await DepartmentService.deleteDepartment(req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Department deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
