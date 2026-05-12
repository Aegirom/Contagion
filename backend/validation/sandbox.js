import { z } from 'zod';

export const evaluateFileSchema = z.object({
  submission_id: z.number({ required_error: 'submission_id is required' }).int().positive(),
  file_hash: z.string().trim().max(128).optional().nullable(),
  environment: z.enum(['Docker', 'VirtualBox', 'KVM']).optional().default('Docker'),
  os_profile: z.string().max(100).optional().default('Windows10'),
  network_enabled: z.boolean().optional().default(false),
  timeout_seconds: z.number().int().min(30).max(600).optional().default(120),
});
