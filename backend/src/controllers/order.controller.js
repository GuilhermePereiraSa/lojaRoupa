import QRCode from "qrcode";
import { generatePixPayload } from "../utils/pix.util.js";
import Order from "../models/order.model.js";
import Clothing from "../models/clothing.model.js";

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

    // 5. Gerar o Pix com os dados reais do Pedido criado
    const pixChave = "leila@lojavirtual.com.br"; // Chave da dona da loja

    const pixCopiaECola = generatePixPayload(
      pixChave,
      "Loja Leila",
      "Sao Carlos", // Cidade do lojista
      `PED${novoPedido.id}`, // ID único real do Postgres gerado agora
      totalAmount, // Valor total seguro e calculado no back-end
    );

    const qrCodeImage = await QRCode.toDataURL(pixCopiaECola);

    // 6. Responder ao Front-end com Sucesso
    res.status(201).json({
      message: "Pedido criado! Aguardando pagamento.",
      orderId: novoPedido.id,
      pix: {
        copiaECola: pixCopiaECola,
        qrCodeImage: qrCodeImage,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar pedido:", error);
    res.status(500).json({ error: "Erro interno ao processar o checkout" });
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
  try {
    const { id } = req.params;

    // search
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    order.status = "Pago";
    await order.save();

    res
      .status(200)
      .json({ message: "Pagamento confirmado com sucesso! ", order });
  } catch (error) {
    console.error("Erro ao confirmar pagamento ", error);
    return res
      .status(500)
      .json({ error: "Erro ao confirmar pagamento no servidor." });
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
      return res.status(404).json({ error: "Pedido não encontrado." });
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
