import Order from "../models/order.model.js";
import Clothing from "../models/clothing.model.js";
import sequelize from "../models/dbconfig.js";
import { Op } from "sequelize";

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

async function decrementStock(items, transaction) {
  for (const item of items) {
    const [affectedRows] = await Clothing.update(
      { stock: sequelize.literal("stock - 1") },
      {
        where: { id: item.id, stock: { [Op.gte]: 1 } },
        transaction,
      },
    );

    if (affectedRows === 0) return { ok: false, item };
  }
  return { ok: true };
}

// ─────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────

async function validateAndPriceItems(items) {
  const itemIds = items.map((item) => item.id);

  const produtosNoBanco = await Clothing.findAll({
    where: { id: itemIds },
  });

  let totalAmount = 0;
  const itensValidados = [];

  for (const itemFront of items) {
    const produtoReal = produtosNoBanco.find((p) => p.id === itemFront.id);

    if (!produtoReal) {
      return {
        error: `Produto ID ${itemFront.id} não encontrado ou indisponível.`,
      };
    }

    const precoReal = parseFloat(produtoReal.price);
    totalAmount += precoReal;

    itensValidados.push({
      id: produtoReal.id,
      name: produtoReal.name,
      price: precoReal,
    });
  }

  return { totalAmount, itensValidados };
}

// ─────────────────────────────────────────────
// PUBLIC — Checkout
// ─────────────────────────────────────────────

export const createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const validated = await validateAndPriceItems(items);
    if (validated.error) {
      return res.status(404).json({ error: validated.error });
    }

    const { totalAmount, itensValidados } = validated;

    const novoPedido = await Order.create({
      totalPrice: totalAmount,
      items: itensValidados,
      userId,
    });

    const mpRes = await fetchMercadoPago(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",
        headers: { "X-Idempotency-Key": `pedido-${novoPedido.id}` },
        body: JSON.stringify({
          transaction_amount: totalAmount,
          payment_method_id: "pix",
          payer: { email: "contato@lojaleia.com.br" },
          description: `Pedido #${novoPedido.id} - Loja Leila`,
          external_reference: String(novoPedido.id),
          notification_url: `${process.env.BASE_URL}/api/orders/webhook/mp`,
        }),
      },
    );

    const mpData = await mpRes.json();
    const pix = mpData.point_of_interaction?.transaction_data;

    if (!pix) {
      console.error("Erro MP:", mpData);
      return res.status(502).json({ message: "Erro ao gerar cobrança Pix." });
    }

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
    await transaction.commit();

    console.log(`✅ Pedido #${orderId} confirmado via Mercado Pago`);
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
// ADMIN — Order management
// ─────────────────────────────────────────────

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
    await transaction.commit();

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
