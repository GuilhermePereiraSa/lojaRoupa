import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
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
