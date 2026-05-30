import express from "express";
import {
  login,
  logout,
  register,
  getUserProfile,
  updateProfile,
  getAllUsers,
  deleteUser,
} from "../controllers/auth.controller.js";
import { verifyAdmin, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// post para /api/auth/register
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/perfil", verifyToken, getUserProfile);
router.put("/perfil", verifyToken, updateProfile);

// get all
router.get("/usuarios", verifyToken, verifyAdmin, getAllUsers);
router.delete("usuarios/:id", verifyToken, deleteUser);

export default router;
