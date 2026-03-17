import express from "express";
import {getAllSubmissions} from '../controllers/SubmissionsController.js';
const router = express.Router();

router.get("/get", getAllSubmissions);
router.post("/post", postSubmission);

export default router;
