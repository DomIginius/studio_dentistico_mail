const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
require("dotenv").config();
const { logEmail } = require("./logEmail");

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

    // Renderizza la view con i dati
    const htmlContent = await ejs.renderFile(templatePath, {
      nome,
      telefono,
    });

    // Invia la mail
    const info = await transporter.sendMail({
      from: `"Chatbot Iginius" <${process.env.EMAIL_SEND}>`,
      to: process.env.MAIL_TO || "info@studiodalessandrosicurella.com",
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
