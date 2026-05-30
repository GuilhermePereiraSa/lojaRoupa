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

// [READ OTHERS] - Listar os pedidos do usuário logado (Histórico do Cliente)
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId; // Capturado pelo verifyToken
    const pedidos = await Order.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar seu histórico de pedidos." });
  }
};

// [DELETE] - Cancelar/Remover um pedido
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Order.findByPk(id);

    if (!pedido)
      return res.status(404).json({ error: "Pedido não encontrado." });

    await pedido.destroy();
    res.status(200).json({ message: "Pedido removido/cancelado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao cancelar o pedido." });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const orders = await findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Erro ao buscar pedidos para o admin: ", error);
    res.status(500).json({ error: "Erro ao carregar o painel de pedidos." });
  }
};

export const confirmOrderPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado. " });
    }

    order.status = "Pago";
    await order.save();

    res.status(200).json({
      message: "Pagamento confirmado com sucesso!",
      order,
    });
  } catch (error) {
    console.error("Erro ao confirmar pagamento:", error);
    res
      .status(500)
      .json({ error: "Erro ao confirmar o pagamento no servidor." });
  }
};
