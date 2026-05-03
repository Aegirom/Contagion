import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
} from "../controllers/NotificationController.js";
import { protect } from "./Auth.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/:notificationId/read", protect, markAsRead);
router.put("/read-all", protect, markAllAsRead);
router.post("/", protect, createNotification);

export default router;
