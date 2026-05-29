import Order from "../models/order.model.js";

export const createOrder = async (req, res) => {
  try {
    const { totalPrice, items } = req.body;

    const userId = req.user.id;

    if (!items || items.length == 0) {
      return res.status(400).json({ message: "O carrinho está vázio." });
    }
    const newOrder = await Order.create({
      totalPrice,
      items,
      userId,
    });

    return res
      .status(201)
      .json({ message: "Pedido finalizado com sucesso!", order: newOrder });
  } catch (error) {
    console.error("Erro ao criar pedido: ", error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};
