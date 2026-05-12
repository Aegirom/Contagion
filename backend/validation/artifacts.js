import { z } from 'zod';

export const uploadArtifactSchema = z.object({
  malware_family: z.string().max(100).optional().nullable(),
  malware_category: z.string().max(100).optional().nullable(),
});
