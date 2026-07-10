import { AnalyticsService } from '../services/analytics.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class AnalyticsController {
  static async getSummary(req, res, next) {
    try {
      const summary = await AnalyticsService.getSummary();
      res.status(200).json(new ApiResponse(200, summary, 'System-wide summary metrics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getDepartments(req, res, next) {
    try {
      const departments = await AnalyticsService.getDepartmentComparison();
      res.status(200).json(new ApiResponse(200, departments, 'Department-wise comparison metrics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getTrends(req, res, next) {
    try {
      const trends = await AnalyticsService.getTrends();
      res.status(200).json(new ApiResponse(200, trends, 'Temporal trend metrics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}
