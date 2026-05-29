import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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

export const verifyAdmin = (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ message: "Utilizador não autenticado" });

  if (req.user.isAdmin !== true) {
    return res.status(403).json({
      message:
        "Acesso irrestrito. Apenas administradores podem realizar essa ação",
    });
  }

  next();
};
