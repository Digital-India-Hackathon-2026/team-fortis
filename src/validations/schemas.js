import { z } from 'zod';

// Department schemas
export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Department name must be at least 2 characters'),
    description: z.string().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});

// Officer schemas
export const createOfficerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Officer name must be at least 2 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    departmentId: z.string().uuid('Invalid department ID'),
    role: z.enum(['OFFICER', 'DEPT_HEAD']).optional(),
  }),
});

export const updateOfficerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    departmentId: z.string().uuid().optional(),
    role: z.enum(['OFFICER', 'DEPT_HEAD']).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  }),
});

// Complaint schemas
export const createComplaintSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.string().min(2, 'Category must be at least 2 characters'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    userId: z.string().uuid('Invalid user ID'),
    departmentId: z.string().uuid().optional(),
    images: z.array(z.string().url('Invalid image URL')).optional(),
  }),
});

export const updateComplaintStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
    remarks: z.string().optional(),
    changedById: z.string().min(1, 'changedById is required'),
    changedByType: z.enum(['USER', 'OFFICER', 'SYSTEM']),
  }),
});

export const assignComplaintSchema = z.object({
  body: z.object({
    departmentId: z.string().uuid().optional(),
    officerId: z.string().uuid().optional(),
  }).refine((data) => data.departmentId || data.officerId, {
    message: 'At least departmentId or officerId must be provided',
    path: ['departmentId'],
  }),
});
