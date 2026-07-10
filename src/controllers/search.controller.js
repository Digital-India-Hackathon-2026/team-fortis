import { SearchService } from '../services/search.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class SearchController {
  static async search(req, res, next) {
    try {
      const query = req.query.q || '';
      const results = await SearchService.searchAll(query);
      res.status(200).json(new ApiResponse(200, results, 'Unified search completed successfully'));
    } catch (error) {
      next(error);
    }
  }
}
