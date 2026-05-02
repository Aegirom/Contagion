import express from 'express';
import { protect } from './Auth.js';
import { getArtifact, getArtifactDownload, listArtifacts, uploadArtifact, uploadMiddleware } from '../controllers/ArtifactsController.js';

const router = express.Router();

router.get('/', protect, listArtifacts);
router.get('/:id', protect, getArtifact);
router.get('/:id/download', protect, getArtifactDownload);
router.post('/upload', protect, uploadMiddleware.single('file'), uploadArtifact);

export default router;
