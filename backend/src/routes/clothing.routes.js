import express from "express";

import {
  createClothing,
  deleteClothing,
  getAllClothings,
  getClothingById,
  updateClothing,
} from "../controllers/clothing.controller.js";

import { upload } from "../config/cloudinary.js";

import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllClothings);
router.get("/:id", getClothingById);

// 1º Tem um token válido? -> 2º É um Admin? -> 3º Faz o Upload da foto -> 4º Grava na base de dados
router.post(
  "/criar",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  createClothing,
);

router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  updateClothing,
);
router.delete("/:id", verifyToken, verifyAdmin, deleteClothing);

export default router;
