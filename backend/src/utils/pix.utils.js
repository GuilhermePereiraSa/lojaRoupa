function formatField(id, value) {
  const size = String(value.length).padStart(2, "0");
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

export function generatePixPayload(
  pixKey,
  merchantName,
  merchantCity,
  txid,
  amount,
) {
  const gui = formatField("00", "br.gov.bcb.pix");
  const key = formatField("01", pixKey);
  const merchantAccountInfo = formatField("26", gui + key);

  const merchantCategoryCode = formatField("52", "0000");
  const transactionCurrency = formatField("53", "0986"); // 0986 = Real Brasileiro
  const transactionAmount = amount
    ? formatField("54", parseFloat(amount).toFixed(2))
    : "";
  const countryCode = formatField("58", "BR");
  const name = formatField("59", merchantName.substring(0, 25));
  const city = formatField("60", merchantCity.substring(0, 15));

  const txidField = formatField("05", txid || "***");
  const additionalDataField = formatField("62", txidField);

  let payload =
    formatField("00", "01") + // Indicador de formato
    formatField("01", "11") + // Pix estático
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    name +
    city +
    additionalDataField;

  const crc16 = getCRC16(payload);
  return payload + "6304" + crc16;
}
