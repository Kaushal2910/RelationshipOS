import { z } from 'zod';

/**
 * Auth + onboarding form schemas (P1). Used by React Hook Form via zodResolver.
 * Keep messages short + warm — they render directly under the field.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('That doesn’t look like a valid email');

// Supabase's default minimum is 6; we ask for 8 for a little more safety.
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  displayName: z.string().trim().min(2, 'Please enter your name').max(40, 'That’s a bit long'),
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Please enter your name')
    .max(40, 'That’s a bit long'),
  city: z.string().trim().min(1, 'Pick your city').default('Pune'),
});
export type ProfileValues = z.infer<typeof profileSchema>;
