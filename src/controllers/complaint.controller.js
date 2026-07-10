import { ComplaintService } from '../services/complaint.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class ComplaintController {
  static async create(req, res, next) {
    try {
      const complaint = await ComplaintService.createComplaint(req.body);
      res.status(201).json(new ApiResponse(201, complaint, 'Complaint filed successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        status: req.query.status,
        severity: req.query.severity,
        departmentId: req.query.departmentId,
        search: req.query.search,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
      };

      const result = await ComplaintService.getAllComplaints(filters, pagination);
      res.status(200).json(new ApiResponse(200, result.data, 'Complaints retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const complaint = await ComplaintService.getComplaintById(req.params.id);
      res.status(200).json(new ApiResponse(200, complaint, 'Complaint details retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const complaint = await ComplaintService.updateComplaintStatus(req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, complaint, 'Complaint status updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async assign(req, res, next) {
    try {
      const complaint = await ComplaintService.assignComplaint(req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, complaint, 'Complaint assigned successfully'));
    } catch (error) {
      next(error);
    }
  }
}
