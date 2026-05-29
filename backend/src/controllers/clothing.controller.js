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

export const createClothing = async (req, res) => {
  try {
    const { name, price, size } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "A imagem do produto é obrigatória." });
    }

    const imagePath = `/public/uploads/${req.file.filename}`;

    const newClothing = await Clothing.create({
      name,
      price,
      size,
      image: imagePath,
    });

    return res.status(201).json({
      message: "Roupa cadastrada com sucesso!",
      clothing: newClothing,
    });
  } catch (error) {
    console.error("Erro ao cadastrar roupa: ", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};
