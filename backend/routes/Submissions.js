import express from "express";
import {getAllSubmissions} from '../controllers/SubmissionsController.js';
const router = express.Router();

router.get("/", getAllSubmissions);

export default router;
