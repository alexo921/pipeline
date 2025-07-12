import { z } from "zod";

// Login Schema
export const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long")
});

export type LoginSchema = z.infer<typeof loginSchema>;

// Signup Schemas
export const signupStep1Schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  healthcareRole: z.string().min(1, 'Please select your healthcare role')
    .refine(
      (val) => ['CNA', 'LPN', 'RN', 'PCA', 'HHA', 'OTHER'].includes(val),
      { message: 'Please select a valid healthcare role' }
    ),
  certificationStatus: z.string().min(1, 'Please select your certification status')
    .refine(
      (val) => ['Certified', 'NotCertified', 'Pending', 'Inprogress'].includes(val),
      { message: 'Please select a valid certification status' }
    ),
});

export const signupBasicSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});


export const signupStep2Schema = z.object({
  zipCode: z.string()
    .min(5, 'ZIP code must be at least 5 characters')
    .max(10, 'ZIP code must be at most 10 characters'),

  address: z.string()
    .min(5, 'Address must be at least 5 characters'),

  // Coerce string input to number, then validate
  maxTravelDistance: z.coerce.number({
    required_error: 'Please enter a travel distance',
    invalid_type_error: 'Please enter a valid number',
  })
    .min(1, 'Travel distance must be at least 1 mile')
    .max(100, 'Travel distance cannot exceed 100 miles'),
});


export const signupStep3Schema = z.object({
  workType: z.array(z.enum(['FullTime', 'PartTime', 'PerDiem', 'LiveIn']))
    .min(1, 'Please select at least one work type'),

  shiftType: z.array(z.enum(['Day', 'Night', 'Weekend', 'Overnight', 'Flexible']))
    .min(1, 'Please select at least one shift type'),

  currentJobStatus: z.enum(
    ['WorkingFullTime', 'WorkingFullTimeAvailable', 'WorkingPartTimeAvailable', 'NotWorkingAvailable', 'NotWorkingOpenOffers'],
    { required_error: 'Please select your current employment status' }
  ),
});


// Types for signup schemas
export type SignupStep1Schema = z.infer<typeof signupStep1Schema>;
export type SignupStep2Schema = z.infer<typeof signupStep2Schema>;
export type SignupStep3Schema = z.infer<typeof signupStep3Schema>;

// Combined signup schema (if needed)
export const signupSchema = signupStep1Schema.merge(signupStep2Schema).merge(signupStep3Schema);
export type SignupSchema = z.infer<typeof signupSchema>;