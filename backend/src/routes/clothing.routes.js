import express from "express";

import {
  createClothing,
  getAllClothings,
} from "../controllers/clothing.controller.js";
import { upload } from "../middlewares/upload.middleware.js";

import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);

// 1º Tem um token válido? -> 2º É um Admin? -> 3º Faz o Upload da foto -> 4º Grava na base de dados
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  createClothing,
);

router.put("/:id", verifyToken, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

export default router;
