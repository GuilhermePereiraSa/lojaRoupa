import { Model, DataTypes } from "sequelize";
import sequelize from "./dbconfig.js";
import User from "./user.model.js";

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    items: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Pendente",
      // Futuros status: "Pago", "Pronto para Retirada", "Saiu para Entrega", "Finalizado"
    },

    // --- NOVOS CAMPOS LOGÍSTICOS ---
    deliveryMethod: {
      type: DataTypes.ENUM("retirada", "entrega"),
      allowNull: false,
      defaultValue: "retirada",
    },
    deliveryAddress: {
      type: DataTypes.STRING,
      allowNull: true, // Pode ser nulo porque se for "retirada", não precisa de endereço
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    timestamps: true,
  },
);

Order.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Order, { foreignKey: "userId" });

export default Order;
