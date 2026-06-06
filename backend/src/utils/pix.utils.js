function formatField(id, value) {
  // O tamanho deve ser baseado em bytes (UTF-8), não apenas caracteres
  const size = String(Buffer.byteLength(value, "utf8")).padStart(2, "0");
  return `${id}${size}${value}`;
}

// Algoritmo CRC16 exigido pelo Banco Central para validar o Pix
function getCRC16(payload) {
  payload += "6304";
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Normaliza strings para o padrão Pix (Sem acentos e em maiúsculo)
 */
function normalizeString(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toUpperCase()
    .substring(0, 25); // Limite de segurança
}

export function generatePixPayload(
  pixKey,
  merchantName,
  merchantCity,
  txid,
  amount,
) {
  // 1. Informações da Conta do Recebedor (Field 26)
  const gui = formatField("00", "br.gov.bcb.pix");
  const key = formatField("01", pixKey);
  const merchantAccountInfo = formatField("26", gui + key);

  // 2. Outros Campos Obrigatórios
  const merchantCategoryCode = formatField("52", "0000");
  const transactionCurrency = formatField("53", "986"); // BRL (986)
  
  // O valor deve ter 2 casas decimais e usar ponto como separador
  const transactionAmount = amount
    ? formatField("54", parseFloat(amount).toFixed(2))
    : "";
    
  const countryCode = formatField("58", "BR");
  const name = formatField("59", normalizeString(merchantName).substring(0, 25));
  const city = formatField("60", normalizeString(merchantCity).substring(0, 15));

  // 3. Dados Adicionais (Field 62) - TXID
  // Para Pix estático, se não houver TXID, recomenda-se usar ***
  const cleanedTxid = (txid || "***").replace(/[^a-zA-Z0-9]/g, "").substring(0, 25);
  const txidField = formatField("05", cleanedTxid || "***");
  const additionalDataField = formatField("62", txidField);

  // 4. Montagem do Payload Completo (sem CRC)
  let payload =
    formatField("00", "01") + // Payload Format Indicator
    formatField("01", "11") + // Point of Initiation Method (11 = estático)
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    name +
    city +
    additionalDataField;

  // 5. Cálculo e Adição do CRC16
  const crc16 = getCRC16(payload);
  return payload + "6304" + crc16;
}
