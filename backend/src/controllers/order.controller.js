import QRCode from "qrcode";
import { generatePixPayload } from "../utils/pix.utils.js";
import Order from "../models/order.model.js";
import Clothing from "../models/clothing.model.js";
import sequelize from "../models/dbconfig.js";
import { Op } from "sequelize";

export const createOrder = async (req, res) => {
  try {
    const { items } = req.body; // Recebemos apenas a lista de itens do Front
    const userId = req.userId; // O ID do usuário logado (injetado pelo middleware verifyToken)

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    // 1. Extrair os IDs dos produtos enviados pelo cliente
    const itemIds = items.map((item) => item.id);

    // 2. Buscar os produtos originais direto no Banco de Dados
    const produtosNoBanco = await Clothing.findAll({
      where: { id: itemIds },
    });

    // 3. Segurança: Calcular o total baseando-se estritamente no Banco de Dados
    let totalAmount = 0;
    const itensValidados = [];

    for (const itemFront of items) {
      // Cruza o item que o usuário pediu com o que existe no banco
      const produtoReal = produtosNoBanco.find((p) => p.id === itemFront.id);

      if (produtoReal) {
        // O Sequelize pode retornar DECIMAL como string, então forçamos o float
        const precoReal = parseFloat(produtoReal.price);
        totalAmount += precoReal;

        // Montamos o JSON limpo para salvar no model Order
        itensValidados.push({
          id: produtoReal.id,
          name: produtoReal.name,
          price: precoReal,
        });
      } else {
        // Se o usuário mandou um ID que não existe, abortamos a operação
        return res.status(404).json({
          error: `Produto ID ${itemFront.id} não encontrado ou indisponível.`,
        });
      }
    }

    // 4. Persistência: Criar o Pedido no Banco de Dados
    // O status será "Pendente" automaticamente devido ao defaultValue no seu Model
    const novoPedido = await Order.create({
      totalPrice: totalAmount,
      items: itensValidados,
      userId: userId,
    });

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": `pedido-${novoPedido.id}`,
      },
      body: JSON.stringify({
        transaction_amount: totalAmount,
        payment_method_id: "pix",
        payer: { email: "contato@lojaleia.com.br" }, // email da loja por enquanto
        description: `Pedido #${novoPedido.id} - Loja Leila`,
        external_reference: String(novoPedido.id), // liga o pagamento MP ao seu pedido
        notification_url: `${process.env.BASE_URL}/api/orders/webhook/mp`,
      }),
    });

    const mpData = await mpResponse.json();
    const pix = mpData.point_of_interaction?.transaction_data;

    if (!pix) {
      console.error("Erro MP: ", mpData);
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
    res.status(500).json({ error: "Erro interno ao processar o checkout" });
  }
};

export const webhookMercadoPago = async (req, res) => {
  res.status(200).json({ ok: true });

  const { type, data } = req.body;

  if (type !== "payment" || !data?.id) return;

  const paymentRes = await fetch(
    `https://api.mercadopago.com/v1/payments/${data.id}`,
    { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } },
  );

  const payment = await paymentRes.json();

  if (payment.status !== "approved") return;

  const orderId = payment.external_reference;

  const transactionBD = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, {
      transaction: transactionBD,
      lock: transactionBD.LOCK.UPDATE,
    });

    if (!order || order.status === "Pago") {
      return await transactionBD.rollback();
    }

    for (const item of order.items) {
      const [affectedRows] = await Clothing.update(
        { stock: sequelize.literal("stock-1") },
        {
          where: { id: item.id, stock: { [Op.gte]: 1 } },
          transaction: transactionBD,
        },
      );

      if (affectedRows === 0) {
        await transactionBD.rollback();
        order.status = "Sem Estoque";
        await order.save();
        return;
      }
    }

    order.status = "Pago";

    await order.save({ transaction: transactionBD });
    await transactionBD.commit();

    console.log(`✅ Pedido #${orderId} confirmado via Mercado Pago`);
  } catch (err) {
    await transactionBD.rollback();
    console.error("Erro no webhook MP:", err);
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
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Erro ao buscar pedidos para o admin: ", error);
    res.status(500).json({ error: "Erro ao carregar o painel de pedidos." });
  }
};

export const confirmOrderPayment = async (req, res) => {
  const transactionBD = await sequelize.transaction();

  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      transaction: transactionBD,
      lock: transactionBD.LOCK.UPDATE,
    });

    if (!order) {
      await transactionBD.rollback(); //
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    // inves de so dar como Pago, bate aqui e da rollback
    if (order.status == "Pago") {
      await transactionBD.rollback();
      return res
        .status(200)
        .json({ message: "Pagamento já havia sido processado anteriormente." });
    }

    // race condition
    for (const item of order.items) {
      const [affectedRows] = await Clothing.update(
        { stock: sequelize.literal("stock-1") },
        {
          where: {
            id: item.id,
            stock: { [Op.gte]: 1 }, // trava de segurança do banco
          },
          transaction: transactionBD,
        },
      );

      if (affectedRows == 0) {
        await transactionBD.rollback();
        order.status = "Sem Estoque";
        await order.save();

        // AUTOMATICO??? NAO TEM COMO???
        return res.status(409).json({
          error: `O produto '${item.name}' esgotou antes da confirmação. Estorno necessário.`,
        });
      }
    }

    order.status = "Pago";
    await order.save({ transaction: transactionBD });

    await transactionBD.commit();

    res.status(200).json({
      message: "Pagamento confirmado com sucesso!",
      order,
    });
  } catch (error) {
    await transactionBD.rollback();
    console.error("Erro ao confirmar pagamento:", error);
    res
      .status(500)
      .json({ error: "Erro ao confirmar o pagamento no servidor." });
  }
};
