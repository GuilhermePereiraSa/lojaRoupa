import { DataTypes } from "sequelize";
import sequelize from "./dbconfig.js";
import User from "./user.model.js";
import Clothing from "./clothing.model.js";

const CartItem = sequelize.define("CartItem", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
});

// Relacionamentos
User.hasMany(CartItem, { foreignKey: "userId", onDelete: "CASCADE" });
CartItem.belongsTo(User, { foreignKey: "userId" });

Clothing.hasMany(CartItem, { foreignKey: "clothingId", onDelete: "CASCADE" });
CartItem.belongsTo(Clothing, { foreignKey: "clothingId" });

export default CartItem;
