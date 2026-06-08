import CartItem from "../models/CartItem.model.js";
import Clothing from "../models/clothing.model.js";

export const getCart = async (req, res) => {
  try {
    const cartItems = await CartItem.findAll({
      where: { userId: req.userId },
      include: [
        {
          model: Clothing,
          attributes: ["id", "name", "price", "size", "image", "stock"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Erro ao buscar carrinho:", error);
    res.status(500).json({ error: "Erro ao carregar o carrinho." });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { clothingId, quantity = 1 } = req.body;

    // O middleware (verifyToken) injeta o ID aqui como req.userId
    const userId = req.userId;

    // Verificar se o produto já existe no carrinho deste utilizador
    let cartItem = await CartItem.findOne({ where: { userId, clothingId } });
    if (cartItem) {
      // Isso delega a matemática para o banco de dados, evitando colisão!
      await cartItem.increment("quantity", { by: quantity });
    } else {
      // Se não existe, cria um novo registo
      cartItem = await CartItem.create({
        userId: userId,
        clothingId: clothingId,
        quantity: quantity,
      });
    }

    res
      .status(200)
      .json({ message: "Produto adicionado ao carrinho!", cartItem });
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho:", error);
    res.status(500).json({ error: "Erro ao adicionar produto." });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params; // ID do CartItem, não do produto
    const userId = req.userId;

    const deleted = await CartItem.destroy({
      where: { id, userId }, // Garante que só apaga se for o dono do item
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Item não encontrado no carrinho." });
    }

    res.status(200).json({ message: "Produto removido com sucesso." });
  } catch (error) {
    console.error("Erro ao remover do carrinho:", error);
    res.status(500).json({ error: "Erro ao remover produto." });
  }
};

export const clearCart = async (req, res) => {
  try {
    await CartItem.destroy({
      where: { userId: req.userId },
    });
    res.status(200).json({ message: "Carrinho esvaziado." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao limpar o carrinho." });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const { id } = req.params; // ID do CartItem
    const { quantity } = req.body; // Nova quantidade exata definida pelo usuário
    const userId = req.userId; // Garantia de segurança via token

    // Trava de segurança: impede enviar texto vazio, zero ou negativo
    if (quantity === undefined || quantity < 1) {
      return res
        .status(400)
        .json({ error: "A quantidade deve ser de pelo menos 1." });
    }

    // Procura o item garantindo que pertence ao usuário logado
    const cartItem = await CartItem.findOne({
      where: { id, userId },
      include: [{ model: Clothing, attributes: ["stock"] }],
    });

    if (!cartItem)
      return res.status(404).json({ error: "Item não encontrado." });

    // NOVA TRAVA: Impede de adicionar mais do que o estoque disponível
    if (quantity > cartItem.Clothing.stock) {
      return res
        .status(400)
        .json({
          error: `Temos apenas ${cartItem.Clothing.stock} unidades em estoque.`,
        });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({
      message: "Quantidade atualizada com sucesso!",
      cartItem,
    });
  } catch (error) {
    console.error("Erro ao atualizar quantidade do carrinho:", error);
    res.status(500).json({ error: "Erro ao atualizar quantidade." });
  }
};
