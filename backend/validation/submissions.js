import { z } from 'zod';

const statusEnum = z.enum(['Draft', 'Pending', 'Published', 'Rejected', 'Archived']);
const templateEnum = z.enum(['MALWARE_ANALYSIS', 'THREAT_REPORT', 'FORENSIC_REPORT', 'INDICATOR_ANALYSIS', 'CASE_STUDY']);

export const postSubmissionSchema = z.object({
  artifact_id: z.number().int().positive().optional().nullable(),
  title: z.string().trim().min(1, 'Title is required').max(255),
  content: z.string().trim().min(1, 'Content is required'),
  status: statusEnum.optional().default('Draft'),
  version: z.number().int().positive().optional().default(1),
  template_type: templateEnum.optional().default('MALWARE_ANALYSIS'),
});

export const updateSubmissionSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  content: z.string().trim().min(1).optional(),
  status: statusEnum.optional(),
  artifact_id: z.number().int().positive().optional().nullable(),
  version: z.number().int().positive().optional(),
  template_type: templateEnum.optional(),
});
