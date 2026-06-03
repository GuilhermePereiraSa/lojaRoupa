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

export const updateClothing = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, size, image } = req.body;

    const clothing = await Clothing.findByPk(id);
    if (!clothing)
      return res.status(404).json({ error: "Produto não encontrado." });

    const caminhoImagem = req.file ? req.file.path : produto.imagem;

    await produto.update({
      nome: req.body.nome,
      preco: req.body.preco,
      tamanho: req.body.tamanho,
      descricao: req.body.descricao,
      imagem: caminhoImagem, // Usa a nova ou preserva a velha
    });
    res
      .status(200)
      .json({ message: "Produto atualizado com sucesso!", clothing });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
};

export const deleteClothing = async (req, res) => {
  try {
    const { id } = req.params;
    const clothing = await Clothing.findByPk(id);
    if (!produto)
      return res.status(404).json({ error: "Produto não encontrado." });

    await produto.destroy();
    res.status(200).json({ message: "Produto removido com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover o produto." });
  }
};
