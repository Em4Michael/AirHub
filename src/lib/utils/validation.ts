import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const entrySchema = z.object({
  profileId: z.string().min(1, 'Profile is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.number().min(0).max(24, 'Time must be between 0 and 24 hours'),
  quality: z.number().min(0).max(100, 'Quality must be between 0 and 100'),
  notes: z.string().optional(),
});

export const bankDetailsSchema = z.object({
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumber: z.string().min(5, 'Account number is required'),
  accountName: z.string().min(2, 'Account name is required'),
  routingNumber: z.string().optional(),
});

export const profileSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  accountBearerName: z.string().min(2, 'Account bearer name is required'),
  defaultWorker: z.string().optional(),
});