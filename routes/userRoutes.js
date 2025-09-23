// routes/userRoutes.js
import express from "express";
import {
  register,
  login,
  updateProfile,
  deleteUser,
  getAllUsers,
  getUserById,
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (user must be logged in)
router.patch("/profile/:id", authenticate, updateProfile);
router.get("/profile/:id", authenticate, getUserById);

// Admin routes (only accessible to admin)
router.get("/", authenticate, authorize("admin"), getAllUsers);
router.delete("/:id", authenticate, authorize("admin"), deleteUser);

export default router;
