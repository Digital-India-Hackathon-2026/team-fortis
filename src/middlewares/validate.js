import { ZodError } from 'zod';
import { BadRequestError } from '../utils/apiError.js';

export const validate = (schema) => {
  return async (req, _res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((err) => ({
          path: err.path.slice(1).join('.'), // Remove 'body', 'query', or 'params' prefix
          message: err.message,
        }));
        next(new BadRequestError('Validation failed', issues));
      } else {
        next(error);
      }
    }
  };
};
