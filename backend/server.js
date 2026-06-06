import express from "express";
import cors from "cors";
import sequelize from "./src/models/dbconfig.js";

import orderRouter from "./src/routes/order.routes.js";
import authRouter from "./src/routes/auth.routes.js";
import clothingRouter from "./src/routes/clothing.routes.js";

// enxergar tables
import "./src/models/user.model.js";
import "./src/models/clothing.model.js";
import "./src/models/order.model.js";

app.set("trust proxy", 1);

const app = express();

app.use(cors());
app.use(express.json()); // Apresentacao - formatacao padrao
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/produtos", clothingRouter);
app.use("/api/pedidos", orderRouter);

app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "OK", message: "Servidor funciona normalmente." });
});

sequelize.sync({}).then(() => {
  app.listen(3001, () => console.log("Server rodando na 3001"));
});
