const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const logFile = path.join(__dirname, "../data/email-log.json");

async function logEmail({ nome, telefono, stato, messageId, errorMessage }) {
  try {
    // Leggi il file esistente
    let logs = [];
    if (fs.existsSync(logFile)) {
      const data = fs.readFileSync(logFile, "utf-8").trim();
      if (data) {
        logs = JSON.parse(data); // parsing solo se il file non è vuoto
      }
    }

    // Aggiungi nuovo log
    logs.push({
      id: uuidv4(),
      nome: nome && nome.trim() !== "" ? nome : "Non fornito",
      telefono,
      timestamp: new Date().toISOString(),
      stato,
      messageId: messageId || "",
      errorMessage: errorMessage || "",
    });

    // Salva il file
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error("Errore scrittura log:", err);
  }
}

module.exports = { logEmail };
