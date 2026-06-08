import express from "express";
import cors from "cors";
import sequelize from "./src/models/dbconfig.js";

import orderRouter from "./src/routes/order.routes.js";
import authRouter from "./src/routes/auth.routes.js";
import clothingRouter from "./src/routes/clothing.routes.js";
import cartRouter from "./src/routes/cart.routes.js";

// enxergar tables
import "./src/models/user.model.js";
import "./src/models/clothing.model.js";
import "./src/models/order.model.js";

const app = express();
app.set("trust proxy", 1);

app.use(cors({ origin: "https://lojaleila.onrender.com" }));
app.use(express.json()); // Apresentacao - formatacao padrao
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/produtos", clothingRouter);
app.use("/api/pedidos", orderRouter);
app.use("/api/cart", cartRouter);

app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "OK", message: "Servidor funciona normalmente." });
});

sequelize.sync({}).then(() => {
  app.listen(3001, () => console.log("Server rodando na 3001"));
});
