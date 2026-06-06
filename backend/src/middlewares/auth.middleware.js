import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res
      .status(401)
      .json({ message: "Acesso negado. Token não fornecido." });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id; // Pendura o ID na requisição para o próximo controlador
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado." });
    }

    return res.status(401).json({ message: "Token inválido." });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    // 1. O verifyToken deixou a variável req.userId?
    if (!req.userId) {
      return res.status(401).json({ message: "Utilizador não autenticado" });
    }

    // 2. Busca o usuário no banco de dados Neon
    const usuario = await User.findByPk(req.userId);

    // 3. Verifica se o usuário existe E se o isAdmin é verdadeiro
    if (!usuario || usuario.isAdmin !== true) {
      return res.status(403).json({
        message:
          "Acesso irrestrito. Apenas administradores podem realizar essa ação",
      });
    }

    next();
  } catch (error) {
    console.error("Erro no middleware verifyAdmin: ", error);
    return res
      .status(500)
      .json({ message: "Erro interno ao verificar permissões." });
  }
};
