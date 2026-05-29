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

    // Valores simulados para o exemplo:
    const orderId = Math.floor(Math.random() * 10000); // Substitua pelo ID real do DB
    const totalAmount = 150.5; // Substitua pela soma real do carrinho

    // 2. Configurações da conta recebedora (Loja Leila)
    const pixChave = "email_ou_telefone_da_loja@exemplo.com";

    // 3. Gerar a string do Pix Copia e Cola
    const pixCopiaECola = generatePixPayload(
      pixChave,
      "Loja Leila",
      "Sao Carlos", // Cidade do lojista
      `PEDIDO${orderId}`, // Identificador único do pedido
      totalAmount,
    );

    // 4. Transformar a string em imagem QR Code (Base64)
    const qrCodeImage = await QRCode.toDataURL(pixCopiaECola);

    // 5. Responder ao Front-end
    res.status(201).json({
      message: "Pedido finalizado com sucesso aguardando pagamento!",
      orderId,
      pix: {
        copiaECola: pixCopiaECola,
        qrCodeImage: qrCodeImage,
      },
    });
  } catch (error) {
    console.error("Erro ao criar pedido: ", error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};
