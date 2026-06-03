import express from "express";

import {
  createClothing,
  deleteClothing,
  getAllClothings,
  getClothingById,
  updateClothing,
} from "../controllers/clothing.controller.js";
import { upload } from "../middlewares/upload.middleware.js";

import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllClothings);
router.get("/:id", getClothingById);

// 1º Tem um token válido? -> 2º É um Admin? -> 3º Faz o Upload da foto -> 4º Grava na base de dados
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  createClothing,
);

router.put("/:id", verifyToken, updateClothing);
router.delete("/:id", verifyToken, deleteClothing);

export default router;
