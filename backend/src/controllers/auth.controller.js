import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Op } from "sequelize";
import { rateLimit } from "express-rate-limit";
import axios from "axios";

dotenv.config();

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Usuário, email e senha são obrigatórios." });
    }

    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "Nome de usuário ou e-mail já cadastrado." });
    }

    // gera hash
    // round 10
    const salt = await bcrypt.genSalt(10);

    const hashedPass = await bcrypt.hash(password, salt);

    await User.create({
      username,
      email,
      password: hashedPass,
    });

    // created sucess
    return res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro no registro: ", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

// PASSPORT?

//const validPassword = await bcrypt.compare(req.body.password, user.password);
// if (!validPassword) return res.status(400).send('Incorrect Password');

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email e senha são obrigatórios" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }, // expirar token em 24 horas
    );

    return res.status(200).json({
      message: "Login realizado com sucesso!",

      token,
    });
  } catch (error) {
    console.error("Erro no login: ", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

export const logout = async (req, res, next) => {
  return (
    res
      .status(200)
      // remova o token no front
      .json({ message: "Logout bem sucedido." })
  );
};

export const getAllUsers = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: ["id", "username", "email", "isAdmin", "createdAt"],
    });
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("ERRO REAL NO GET ALL USERS:", error);

    res.status(500).json({
      message: "Erro do servidor interno.",
      detalhe: error.message,
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.userId, {
      attributes: ["id", "username", "email", "isAdmin", "createdAt"],
    });
    if (!usuario)
      return res.status(404).json({ error: "Erro ao carregar perfil." });

    return res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar dados do perfil." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, password } = req.body;
    const usuario = await User.findByPk(req.userId);

    if (!usuario)
      return res.status(404).json({ error: "Erro ao carregar perfil." });

    const updates = { username };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    await usuario.update(updates);

    res.status(200).json({
      message: "Perfil atualizado com sucesso!",
      user: { username },
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar dados do perfil." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.findByPk(id);

    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado." });

    await usuario.destroy();
    res
      .status(200)
      .json({ message: "Conta de usuário removida do sistema com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar usuário do sistema." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    const userId = req.userId;

    if (novaSenha.length < 8) {
      return res
        .status(400)
        .json({ error: "A nova senha deve ter pelo menos 8 caracteres." });
    }

    if (!senhaAtual || !novaSenha) {
      return res
        .status(400)
        .json({ error: "Senha atual e nova senha são obrigatórias." });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const validPassword = await bcrypt.compare(senhaAtual, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "A senha atual está incorreta." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(novaSenha, salt);
    await user.save();

    res.status(200).json({ message: "Senha atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao alterar senha: ", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "O email é obrigatório." });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(200).json({
        message:
          "Se o e-mail existir em nossa base, um link de recuperação será enviado.",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const expireTime = new Date(Date.now() + 3600000); // 1 hora

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: expireTime,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/pages/redefinir-senha.html?token=${resetToken}`;

    // Disparo da API HTTP usando Axios
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: "contato.lojaleila@gmail.com",
          name: "Loja Leila",
        },
        to: [
          {
            email: user.email,
          },
        ],
        subject: "Recuperação de Senha - Loja Leila",
        htmlContent: `
            <h3>Recuperação de Senha</h3>
            <p>Você solicitou a redefinição de senha para a conta associada a este e-mail.</p>
            <p>Clique no link abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <br><br>
            <p>Se você não solicitou isso, ignore este e-mail e sua senha permanecerá inalterada.</p>
            <p><em>O link expira em 1 hora.</em></p>
          `,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      },
    );

    // Se a execução chegou aqui, o Axios confirmou que a API retornou Sucesso (Status 2xx).
    return res.status(200).json({
      message:
        "Se o e-mail existir em nossa base, um link de recuperação será enviado.",
    });
  } catch (error) {
    // Tratamento de erro otimizado para extrair a mensagem real da API do Brevo
    console.error(
      "Erro no forgotPassword: ",
      error.response ? error.response.data : error.message,
    );
    return res
      .status(500)
      .json({ message: "Erro interno ao processar a solicitação." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res
        .status(400)
        .json({ message: "Token e nova senha são obrigatórias." });
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [Op.gt]: new Date(), // "Op.gt" significa Greater Than (Maior que agora)
        },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "O link de recuperação é inválido ou expirou." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(novaSenha, salt);

    await user.update({
      password: hashedPass,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return res.status(200).json({
      message: "Senha redefinida com sucesso! Você já pode fazer login.",
    });
  } catch (error) {
    console.error("Erro no resetPassword: ", error);
    return res
      .status(500)
      .json({ message: "Erro interno ao processar a solicitação." });
  }
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 5, // Limite de 5 tentativas de requisição por IP dentro da janela
  message: {
    error:
      "Muitas tentativas de login detectadas. Por segurança, tente novamente em 15 minutos.",
  },
  standardHeaders: true, // Retorna os headers de rate limit no padrão `RateLimit-*`
  legacyHeaders: false, // Desabilita os headers antigos `X-RateLimit-*`
});
