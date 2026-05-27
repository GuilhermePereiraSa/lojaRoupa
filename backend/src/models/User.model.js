import { Model, DataTypes } from "sequelize";

import sequelize from "./dbconfig.js";

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false, // Onde guardaremos o hash do bcrypt
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true, // cria automaticamente as colunas createdAt e updatedAt
  },
);

export default User;
