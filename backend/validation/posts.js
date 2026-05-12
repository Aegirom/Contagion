import { z } from 'zod';

export const addCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(5000),
});
