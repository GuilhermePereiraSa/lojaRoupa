import Clothing from "../models/clothing.model.js";

export const getAllClothings = async (req, res) => {
  try {
    const clothings = await Clothing.findAll();
    return res.status(200).json(clothings);
  } catch (error) {
    console.error("Erro ao buscar roupas: ", error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};
