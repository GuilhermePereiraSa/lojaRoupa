import express from "express";
import {
  confirmOrderPayment,
  createOrder,
  getAdminOrders,
} from "../controllers/order.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createOrder);
router.get("/admin", verifyToken, getAdminOrders);
router.patch("/:id/confirmar", verifyToken, confirmOrderPayment);

export default router;
