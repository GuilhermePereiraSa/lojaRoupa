import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartQuantity,
} from "../controllers/cart.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Todas as rotas de carrinho exigem que o utilizador esteja logado
router.use(verifyToken);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update/:id", updateCartQuantity);
router.delete("/remove/:id", removeFromCart);
router.delete("/clear", clearCart);

export default router;
