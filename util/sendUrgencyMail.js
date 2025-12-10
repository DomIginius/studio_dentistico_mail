const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
require("dotenv").config();
const { logEmail } = require("./logEmail");

function formatDateTime(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // mesi 0-11
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return {
    date: `${dd}/${mm}/${yyyy}`,
    time: `${hh}:${min}`,
  };
}

async function sendUrgencyMail({ nome, telefono }) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtps.aruba.it",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SEND,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Path della view EJS
    const templatePath = path.join(__dirname, "../views/urgency.ejs");

    const now = new Date();
    const { date, time } = formatDateTime(now);

    // Renderizza la view con i dati
    const htmlContent = await ejs.renderFile(templatePath, {
      nome,
      telefono,
      date,
      time,
    });

    // Invia la mail
    const info = await transporter.sendMail({
      from: `"Chatbot Iginius" <${process.env.EMAIL_SEND}>`,
      to: process.env.MAIL_TO || "domenico.cicero@iginius.net",
      // to: process.env.MAIL_TO || "info@studiodalessandrosicurella.com",
      subject: "Nuova richiesta URGENZA dal chatbot",
      html: htmlContent,
    });

    console.log("Mail inviata con successo:", info.messageId);

    await logEmail({
      nome,
      telefono,
      stato: "SUCCESS",
      messageId: info.messageId,
      errorMessage: "",
    });
    return info;
  } catch (err) {
    console.error("Errore invio mail:", err);

    await logEmail({
      nome,
      telefono,
      stato: "ERROR",
      messageId: "",
      errorMessage: err.message,
    });

    throw err;
  }
}

module.exports = { sendUrgencyMail };
