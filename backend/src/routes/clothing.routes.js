import express from "express";

import {
  createClothing,
  deleteClothing,
  getAllClothings,
  getClothingById,
  updateClothing,
} from "../controllers/clothing.controller.js";

import { storage } from "../config/cloudinary.js";

import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllClothings);
router.get("/:id", getClothingById);

const upload = multer({ storage: storage });

// 1º Tem um token válido? -> 2º É um Admin? -> 3º Faz o Upload da foto -> 4º Grava na base de dados
router.post(
  "/criar",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  createClothing,
);

router.put("/:id", verifyToken, updateClothing);
router.delete("/:id", verifyToken, deleteClothing);

export default router;
