import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Passamos a URL completa como primeiro parâmetro
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  // desativa os logs do SQL no terminal para ficar mais limpo
  logging: false,
});

export default sequelize;
