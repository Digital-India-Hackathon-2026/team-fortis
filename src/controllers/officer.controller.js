import { OfficerService } from '../services/officer.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class OfficerController {
  static async create(req, res, next) {
    try {
      const officer = await OfficerService.createOfficer(req.body);
      res.status(201).json(new ApiResponse(201, officer, 'Officer registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const departmentId = req.query.departmentId;
      const officers = await OfficerService.getAllOfficers(departmentId);
      res.status(200).json(new ApiResponse(200, officers, 'Officers retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const officer = await OfficerService.getOfficerById(req.params.id);
      res.status(200).json(new ApiResponse(200, officer, 'Officer details retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const officer = await OfficerService.updateOfficer(req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, officer, 'Officer profile updated successfully'));
    } catch (error) {
      next(error);
    }
  }
}
