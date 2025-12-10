const express = require("express");
const { sendUrgencyMail } = require("./util/sendUrgencyMail");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.post("/urgenza", async (req, res) => {
  const { nome, telefono } = req.body;
  if (!telefono) {
    return res.status(400).json({ error: "Campi richiesti: nome, telefono" });
  }

  try {
    await sendUrgencyMail({ nome, telefono });
    res.status(200).json({ message: "Email inviata con successo" });
  } catch (err) {
    res.status(500).json({ error: "Errore invio email" });
  }
});

app.get("/email-logs", (req, res) => {
  try {
    const logFile = path.join(__dirname, "data/email-log.json");
    let logs = [];

    if (fs.existsSync(logFile)) {
      const data = fs.readFileSync(logFile, "utf-8").trim();
      if (data) logs = JSON.parse(data);
    }

    res.render("log", { logs, pageTitle: "Email Logs" });
  } catch (err) {
    console.error("Errore lettura log:", err);
    res.status(500).send("Errore nella lettura dei log");
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`Server avviato su http://localhost:${PORT}`)
);
