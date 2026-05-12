import { z } from 'zod';

export const submitReviewSchema = z.object({
  technical_score: z.number().int().min(1, 'Score must be at least 1').max(10, 'Score must be at most 10'),
  methodology_score: z.number().int().min(1).max(10),
  documentation_score: z.number().int().min(1).max(10),
  insights_score: z.number().int().min(1).max(10),
  comments: z.string().trim().min(10, 'Comments must be at least 10 characters').max(5000),
});
