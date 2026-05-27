import express from "express";
import cors from "cors";
import sequelize from "./src/models/dbconfig.js";
import router from "/home/amns/Documents/lojaRoupa/backend/src/routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json()); // Apresentacao - formatacao padrao
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", router);

sequelize.sync().then(() => {
  app.listen(3000, () => console.log("Server rodando na 3000"));
});
