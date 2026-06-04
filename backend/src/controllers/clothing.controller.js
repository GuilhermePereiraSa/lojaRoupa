import Clothing from "../models/clothing.model.js";

// GET READ
export const getAllClothings = async (req, res) => {
  try {
    const clothings = await Clothing.findAll();
    return res.status(200).json(clothings);
  } catch (error) {
    console.error("Erro ao buscar roupas: ", error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};

// GET by ID
export const getClothingById = async (req, res) => {
  try {
    const { id } = req.params;
    const clothing = await Clothing.findByPk(id);
    if (!clothing)
      return res.status(404).json({ error: "Produto não encontrado" });
    res.status(200).json(clothing);
  } catch (error) {
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};

// POST CREATE
export const createClothing = async (req, res) => {
  try {
    const { name, price, size } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "A imagem do produto é obrigatória." });
    }

    // Cloudinary returns the URL in req.file.path
    const imagePath = req.file.path;

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

export const updateClothing = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, size } = req.body;

    const clothing = await Clothing.findByPk(id);
    if (!clothing)
      return res.status(404).json({ error: "Produto não encontrado." });

    // Se houver nova imagem, usa o path do Cloudinary, senão mantém a antiga
    const imagePath = req.file ? req.file.path : clothing.image;

    await clothing.update({
      name: name || clothing.name,
      price: price || clothing.price,
      size: size || clothing.size,
      image: imagePath,
    });
    
    res
      .status(200)
      .json({ message: "Produto atualizado com sucesso!", clothing });
  } catch (error) {
    console.error("Erro ao atualizar produto: ", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
};

export const deleteClothing = async (req, res) => {
  try {
    const { id } = req.params;
    const clothing = await Clothing.findByPk(id);
    if (!clothing)
      return res.status(404).json({ error: "Produto não encontrado." });

    await clothing.destroy();
    res.status(200).json({ message: "Produto removido com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover o produto." });
  }
};
