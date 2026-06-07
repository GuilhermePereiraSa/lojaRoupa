import axios from "axios";

const sendBrevoEmail = async (toEmail, toName, subject, htmlContent) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: "contato.lojaleila@gmail.com",
          name: "Loja Leila",
        },
        to: [
          {
            email: toEmail,
            name: toName || "Cliente",
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      },
    );
    console.log(`E-mail '${subject}' enviado com sucesso para ${toEmail}`);
  } catch (error) {
    console.error(
      "Erro no disparo de e-mail (Brevo):",
      error.response ? error.response.data : error.message,
    );
  }
};

export const sendOrderReceiptEmail = async (user, order) => {
  const subject = `Pagamento Confirmado! Pedido #${order.id} - Loja Leila`;

  const totalFormatado = Number(order.totalPrice).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const htmlContent = `
      <h2>Olá, ${user.username}!</h2>
      <p>Temos ótimas notícias! O pagamento do seu pedido <strong>#${order.id}</strong> foi aprovado pelo Mercado Pago.</p>
      <p><strong>Resumo da Compra:</strong></p>
      <ul>
        <li>Total Pago: ${totalFormatado}</li>
        <li>Status: Preparando para envio</li>
      </ul>
      <br>
      <p>A Dona Leila já está a separar as suas peças com muito carinho. Avisaremos assim que a encomenda for despachada!</p>
      <p>Obrigado por comprar na Loja Leila.</p>
    `;

  await sendBrevoEmail(user.email, user.username, subject, htmlContent);
};

export const sendStatusUpdateEmail = async (user, order) => {
  let subject = "";
  let htmlContent = "";

  if (order.status === "Pronto para Retirada") {
    subject = `O seu pedido está pronto! #${order.id} - Loja Leila`;
    htmlContent = `
          <h2>Olá, ${user.username}!</h2>
          <p>Temos ótimas notícias! O seu pedido <strong>#${order.id}</strong> já está separado e embalado aqui em casa.</p>
          <p>Pode passar aqui para pegar quando quiser!</p>
          <br>
          <p>Obrigada por comprar na Loja Leila.</p>
        `;
  } else if (order.status === "Saiu para Entrega") {
    subject = `O seu pedido está a caminho! #${order.id} - Loja Leila`;
    htmlContent = `
          <h2>Olá, ${user.username}!</h2>
          <p>O seu pedido <strong>#${order.id}</strong> acabou de sair para entrega.</p>
          <p>Estou a caminho para entregar no endereço que nos indicou:</p>
          <blockquote style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #065a52;">
            <em>${order.deliveryAddress}</em>
          </blockquote>
          <p>Chego em breve!</p>
          <br>
          <p>Obrigada por comprar na Loja Leila.</p>
        `;
  } else {
    // Se for outro status ("Finalizado", "Sem Estoque", etc.), não envia este e-mail específico
    return;
  }

  // Dispara o e-mail
  await sendBrevoEmail(user.email, user.username, subject, htmlContent);
};
