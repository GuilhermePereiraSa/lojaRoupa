import { Model, DataTypes } from "sequelize";

import sequelize from "./dbconfig";

class Clothing extends Model {}

Clothing.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    size: {
      type: DataTypes.ENUM("P", "M", "G"),
      allowNull: false,
    },

    // url para a imagem
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: false,
    tableNames: "clothings",
  },
);

export default Clothing;
