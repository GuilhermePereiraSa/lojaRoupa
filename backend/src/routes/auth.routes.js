import express from "express";
import {
  login,
  logout,
  register,
  getUserProfile,
  updateProfile,
  getAllUsers,
  deleteUser,
  changePassword,
  loginLimiter,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// post para /api/auth/register
router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

router.get("/perfil", verifyToken, getUserProfile);
router.put("/perfil", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);

// get all
router.get("/usuarios", verifyToken, verifyAdmin, getAllUsers);
router.delete("/usuarios/:id", verifyToken, deleteUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
