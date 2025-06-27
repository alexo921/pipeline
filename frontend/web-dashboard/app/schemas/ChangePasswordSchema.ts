import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;