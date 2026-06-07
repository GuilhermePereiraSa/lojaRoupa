import Order from "../models/order.model.js";
import Clothing from "../models/clothing.model.js";
import User from "../models/user.model.js"; // NOVO: Necessário para buscar o e-mail do cliente
import sequelize from "../models/dbconfig.js";
import { Op } from "sequelize";

import CartItem from "../models/CartItem.model.js";

import {
  sendOrderReceiptEmail,
  sendStatusUpdateEmail,
} from "../services/email.service.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function fetchMercadoPago(url, options) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      ...options.headers,
    },
  });
}

// ─────────────────────────────────────────────
// HELPERS ATUALIZADOS
// ─────────────────────────────────────────────

// Atualizado para suportar a quantidade exata do carrinho, em vez de baixar sempre 1
async function decrementStock(items, transaction) {
  for (const item of items) {
    const quantity = item.quantity || 1; // Pega a quantidade ou assume 1 por segurança

    const [affectedRows] = await Clothing.update(
      { stock: sequelize.literal(`stock - ${quantity}`) },
      {
        // Só permite baixar se o stock atual for maior ou igual à quantidade solicitada
        where: { id: item.id, stock: { [Op.gte]: quantity } },
        transaction,
      },
    );

    if (affectedRows === 0) return { ok: false, item };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────
// PUBLIC — Checkout (Refatorado para Carrinho no Back-end)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// PUBLIC — Checkout (Refatorado para Carrinho no Back-end e Logística Local)
// ─────────────────────────────────────────────

export const createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    // Recebendo os dados de entrega do front-end
    const { deliveryMethod, deliveryAddress } = req.body;

    // Validação de Logística
    if (!deliveryMethod || !["retirada", "entrega"].includes(deliveryMethod)) {
      return res.status(400).json({
        error:
          "Por favor, escolha um método de recebimento válido (retirada ou entrega).",
      });
    }

    if (
      deliveryMethod === "entrega" &&
      (!deliveryAddress || deliveryAddress.trim() === "")
    ) {
      return res.status(400).json({
        error:
          "Para entregas, é necessário informar o endereço ou ponto de referência.",
      });
    }

    // 1. Procuramos o carrinho do usuário na base de dados
    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [{ model: Clothing }],
    });

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "O seu carrinho está vazio." });
    }

    let totalAmount = 0;
    const itensValidados = [];

    // 2. Valida o stock atual e calcula o total
    for (const item of cartItems) {
      const produto = item.Clothing;

      if (!produto) {
        return res
          .status(404)
          .json({ error: `Produto ID ${item.clothingId} não encontrado.` });
      }

      if (produto.stock < item.quantity) {
        return res.status(409).json({
          error: `O produto '${produto.name}' não possui stock suficiente para a quantidade solicitada.`,
        });
      }

      const precoReal = parseFloat(produto.price);
      totalAmount += precoReal * item.quantity;

      itensValidados.push({
        id: produto.id,
        name: produto.name,
        price: precoReal,
        quantity: item.quantity,
      });
    }

    // 3. Cria o Pedido com os itens e DADOS DE ENTREGA
    const novoPedido = await Order.create({
      totalPrice: totalAmount,
      items: itensValidados,
      userId,
      deliveryMethod,
      deliveryAddress: deliveryMethod === "entrega" ? deliveryAddress : null, // Limpa o endereço se for retirada
    });

    // 4. Gera o Pix no Mercado Pago
    const mpRes = await fetchMercadoPago(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",
        headers: { "X-Idempotency-Key": `pedido-${novoPedido.id}` },
        body: JSON.stringify({
          transaction_amount: totalAmount,
          payment_method_id: "pix",
          payer: { email: "contato@lojaleila.com.br" },
          description: `Pedido #${novoPedido.id} - Loja Leila`,
          external_reference: String(novoPedido.id),
          notification_url: `${process.env.BASE_URL}/api/pedidos/webhook/mp`,
        }),
      },
    );

    const mpData = await mpRes.json();
    const pix = mpData.point_of_interaction?.transaction_data;

    if (!pix) {
      console.error("Erro MP:", mpData);
      return res.status(502).json({ message: "Erro ao gerar cobrança Pix." });
    }

    // 5. MÁGICA: Esvazia o carrinho do usuário após criar o pedido com sucesso!
    await CartItem.destroy({ where: { userId } });

    res.status(201).json({
      message: "Pedido criado! Aguardando pagamento.",
      orderId: novoPedido.id,
      pix: {
        copiaECola: pix.qr_code,
        qrCodeImage: `data:image/png;base64,${pix.qr_code_base64}`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar pedido:", error);
    res.status(500).json({ error: "Erro interno ao processar o checkout." });
  }
};

// ─────────────────────────────────────────────
// PUBLIC — Webhook (Mercado Pago)
// ─────────────────────────────────────────────

export const webhookMercadoPago = async (req, res) => {
  res.status(200).json({ ok: true });

  const { type, data } = req.body;
  if (type !== "payment" || !data?.id) return;

  const paymentRes = await fetchMercadoPago(
    `https://api.mercadopago.com/v1/payments/${data.id}`,
    {},
  );
  const payment = await paymentRes.json();

  if (payment.status !== "approved") return;

  const orderId = payment.external_reference;
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order || order.status === "Pago") {
      return await transaction.rollback();
    }

    const stock = await decrementStock(order.items, transaction);

    if (!stock.ok) {
      await transaction.rollback();
      order.status = "Sem Estoque";
      await order.save();
      return;
    }

    order.status = "Pago";
    await order.save({ transaction });
    await transaction.commit(); // ✅ Transação finalizada e banco liberado

    console.log(`✅ Pedido #${orderId} confirmado via Mercado Pago`);

    // 📩 Disparo de E-mail Assíncrono (Pós-Commit)
    try {
      const user = await User.findByPk(order.userId);
      if (user) {
        sendOrderReceiptEmail(user, order);
      }
    } catch (emailError) {
      console.error("Erro ao enviar e-mail de recibo (Webhook):", emailError);
    }
  } catch (err) {
    await transaction.rollback();
    console.error("Erro no webhook MP:", err);
  }
};

// ─────────────────────────────────────────────
// CUSTOMER — Order history & management
// ─────────────────────────────────────────────

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const pedidos = await Order.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar seu histórico de pedidos." });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Order.findByPk(id);

    if (!pedido) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    await pedido.destroy();
    res.status(200).json({ message: "Pedido removido/cancelado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao cancelar o pedido." });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Atualização de Status Logístico
// ─────────────────────────────────────────────

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Lista de status permitidos na máquina de estados do sistema
    const allowedStatuses = [
      "Pendente",
      "Pago",
      "Sem Estoque",
      "Pronto para Retirada",
      "Saiu para Entrega",
      "Finalizado",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Status inválido fornecido." });
    }

    // Procura o pedido e faz o JOIN com o User para termos o e-mail e nome do cliente
    const order = await Order.findByPk(id, {
      include: [{ model: User, attributes: ["username", "email"] }],
    });

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    // Se o admin tentar colocar o mesmo status que já está, poupamos processamento
    if (order.status === status) {
      return res
        .status(200)
        .json({ message: "O pedido já possui este status.", order });
    }

    // Atualiza a base de dados
    order.status = status;
    await order.save();

    // 📩 Disparo da automação de e-mail (apenas para os eventos logísticos)
    if (["Pronto para Retirada", "Saiu para Entrega"].includes(status)) {
      try {
        if (order.User) {
          // O serviço não usa "await" para a resposta da API ser instantânea para a Dona Leila
          sendStatusUpdateEmail(order.User, order);
        }
      } catch (emailError) {
        console.error("Erro ao notificar cliente sobre a entrega:", emailError);
      }
    }

    return res.status(200).json({
      message: `Status atualizado para '${status}' com sucesso! A cliente será notificada.`,
      order,
    });
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    return res
      .status(500)
      .json({ error: "Erro interno ao atualizar o pedido." });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Erro ao buscar pedidos para o admin:", error);
    res.status(500).json({ error: "Erro ao carregar o painel de pedidos." });
  }
};

export const confirmOrderPayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    if (order.status === "Pago") {
      await transaction.rollback();
      return res
        .status(200)
        .json({ message: "Pagamento já havia sido processado anteriormente." });
    }

    const stock = await decrementStock(order.items, transaction);

    if (!stock.ok) {
      await transaction.rollback();
      order.status = "Sem Estoque";
      await order.save();
      return res.status(409).json({
        error: `O produto '${stock.item.name}' esgotou antes da confirmação. Estorno necessário.`,
      });
    }

    order.status = "Pago";
    await order.save({ transaction });
    await transaction.commit(); // ✅ Transação finalizada e banco liberado

    // 📩 Disparo de E-mail Assíncrono (Ação Manual do Admin)
    try {
      const user = await User.findByPk(order.userId);
      if (user) {
        sendOrderReceiptEmail(user, order);
      }
    } catch (emailError) {
      console.error(
        "Erro ao enviar e-mail de recibo (Painel Admin):",
        emailError,
      );
    }

    res
      .status(200)
      .json({ message: "Pagamento confirmado com sucesso!", order });
  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao confirmar pagamento:", error);
    res
      .status(500)
      .json({ error: "Erro ao confirmar o pagamento no servidor." });
  }
};
