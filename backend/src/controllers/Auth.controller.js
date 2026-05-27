import bcrypt from "bcrypt";
import User from "../models/User.model.js";
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
      { id: user.id, username: user.username },
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
  req.logout();
  res.status(204).json();
};
