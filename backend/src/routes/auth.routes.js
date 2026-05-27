import express from "express";
import { register } from "../controllers/Auth.controller.js";

const router = express.Router();

// post para /api/auth/register
router.post("register", register);
router.post("/login", login);
// logout

export default router;
