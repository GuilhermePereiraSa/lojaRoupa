import express from "express";
import {
  createOrder,
  getUserOrders,
  confirmOrderPayment,
  deleteOrder,
  getAdminOrders,
  webhookMercadoPago,
} from "../controllers/order.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createOrder);
router.get("/meus", verifyToken, getUserOrders);

router.get("/admin", verifyToken, getAdminOrders);
router.patch("/:id/confirmar", verifyToken, confirmOrderPayment);
router.delete("/:id", verifyToken, deleteOrder); // deletar pedido
router.post("/webhook/mp", verifyToken, webhookMercadoPago);

export default router;
