import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { Op } from "sequelize";

dotenv.config();

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verifica no banco de dados se existe já, deve ser unico
    const userExists = await User.findOne({ where: { username } });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "Este usuário já está cadastrado." });
    }

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Usuário e senha são obrigatórios." });
    }

    // gera hash
    // round 10
    const salt = await bcrypt.genSalt(10);

    const hashedPass = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Usuário e senha são obrigatórios" });
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: "Usuário ou senha incorretos" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Usuário ou senha incorretos" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }, // expirar token em 24 horas
    );

    return res.status(200).json({
      message: "Login realizado com sucesso!",

      // LOCAL STORAGE !!!
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
      attributes: ["id", "name", "email"],
    });
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: "Erro do servidor interno." });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.userId, {
      attributes: ["id", "name", "email"],
    });
    if (!usuario)
      return res.status(404).json({ error: "Erro ao carregar perfil." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar dados do perfil." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const usuario = await User.findByPk(req.userId);

    if (!usuario)
      return res.status(404).json({ error: "Erro ao carregar perfil." });

    await usuario.update({ name, email });
    res.status(200).json({
      message: "Perfil atualizado com sucesso!",
      user: { name, email },
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

    if (!senhaAtual || novaSenha) {
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

    const expireTime = new Date(Date.now() + 3600000);

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: expireTime,
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/pages/redefinir-senha.html?token=${resetToken}`;

    const mailOptions = {
      from: `"Loja Leila" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Recuperação de Senha - Loja Leila",
      text: `Você solicitou a redefinição de senha.\n\nClique no link abaixo ou cole no seu navegador para criar uma nova senha:\n\n${resetUrl}\n\nSe você não solicitou isso, ignore este e-mail e sua senha permanecerá inalterada.\n\nO link expira em 1 hora.`,
    };

    // Envia o e-mail
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message:
        "Se o e-mail existir em nossa base, um link de recuperação será enviado.",
    });
  } catch (error) {
    console.error("Erro no forgotPassword: ", error);
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
