const axios = require("axios");
const ejs = require("ejs");
const path = require("path");
require("dotenv").config();
const { logEmail } = require("./logEmail");

const API_USER_ID = process.env.SENDPULSE_USER_ID;
const API_SECRET = process.env.SENDPULSE_SECRET;
const FROM_EMAIL = process.env.MAIL_FROM || "notifiche@iginius.it";
const FROM_NAME = process.env.MAIL_FROM_NAME || "Chatbot Iginius";

// 🔐 Ottieni token OAuth2 da SendPulse
async function getAccessToken() {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", API_USER_ID);
    params.append("client_secret", API_SECRET);

    const response = await axios.post(
      "https://api.sendpulse.com/oauth/access_token",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return response.data.access_token;
  } catch (err) {
    console.error(
      "❌ Errore nel recupero del token:",
      err.response?.data || err.message
    );
    throw new Error("Token API non ottenuto");
  }
}

// 📧 Invia email tramite SendPulse API SMTP
async function sendEmail(to, subject, html) {
  const token = await getAccessToken();
  const htmlBase64 = Buffer.from(html, "utf-8").toString("base64");

  const emailData = {
    email: {
      html: htmlBase64,
      text: "Email generata automaticamente dal sistema Chatbot Iginius",
      subject,
      from: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      auto_plain_text: false,
    },
  };

  try {
    const response = await axios.post(
      "https://api.sendpulse.com/smtp/emails",
      emailData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Email inviata con successo a", to);
    return response.data;
  } catch (err) {
    console.error("❌ Errore invio email:", err.response?.data || err.message);
    throw new Error("Invio email fallito");
  }
}

// 📄 Renderizza template EJS
async function renderTemplate(templateName, data) {
  const templatePath = path.join(__dirname, "../views", `${templateName}.ejs`);
  try {
    const html = await ejs.renderFile(templatePath, data);
    return html;
  } catch (err) {
    console.error("❌ Errore nel rendering del template:", err);
    throw err;
  }
}

// 🧩 Funzione principale per invio urgenza
async function sendUrgencyMail({ nome, telefono, descrizione }) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const date = `${dd}/${mm}/${yyyy}`;
  const time = `${hh}:${min}`;

  try {
    const htmlContent = await renderTemplate("urgency", {
      nome: nome && nome.trim() !== "" ? nome : "Non fornito",
      telefono,
      date,
      time,
      descrizione,
    });

    const subject = `Richiesta Urgenza ${date} ${time}`;
    const response = await sendEmail(process.env.MAIL_TO, subject, htmlContent);

    await logEmail({
      nome,
      telefono,
      stato: "SUCCESS",
      messageId: response.id || "", // SendPulse ritorna id nella response
      errorMessage: "",
    });

    return response;
  } catch (err) {
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

// const nodemailer = require("nodemailer");
// const ejs = require("ejs");
// const path = require("path");
// require("dotenv").config();
// const { logEmail } = require("./logEmail");

// function formatDateTime(date) {
//   const dd = String(date.getDate()).padStart(2, "0");
//   const mm = String(date.getMonth() + 1).padStart(2, "0"); // mesi 0-11
//   const yyyy = date.getFullYear();
//   const hh = String(date.getHours()).padStart(2, "0");
//   const min = String(date.getMinutes()).padStart(2, "0");

//   return {
//     date: `${dd}/${mm}/${yyyy}`,
//     time: `${hh}:${min}`,
//   };
// }

// async function sendUrgencyMail({ nome, telefono, descrizione }) {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: "smtps.aruba.it",
//       port: 587,
//       secure: false,
//       auth: {
//         user: process.env.EMAIL_SEND,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });

//     // Path della view EJS
//     const templatePath = path.join(__dirname, "../views/urgency.ejs");

//     const now = new Date();
//     const { date, time } = formatDateTime(now);

//     // Renderizza la view con i dati
//     const htmlContent = await ejs.renderFile(templatePath, {
//       nome,
//       telefono,
//       date,
//       time,
//       descrizione,
//     });

//     // Invia la mail
//     const info = await transporter.sendMail({
//       from: `"Chatbot Iginius" <${process.env.EMAIL_SEND}>`,
//       to: process.env.MAIL_TO || "domenico.cicero@iginius.net",
//       // to: process.env.MAIL_TO || "info@studiodalessandrosicurella.com",
//       subject: "Richiesta Urgenza " + date + " " + time,
//       html: htmlContent,
//     });

//     console.log("Mail inviata con successo:", info.messageId);

//     await logEmail({
//       nome,
//       telefono,
//       stato: "SUCCESS",
//       messageId: info.messageId,
//       errorMessage: "",
//     });
//     return info;
//   } catch (err) {
//     console.error("Errore invio mail:", err);

//     await logEmail({
//       nome,
//       telefono,
//       stato: "ERROR",
//       messageId: "",
//       errorMessage: err.message,
//     });

//     throw err;
//   }
// }

// module.exports = { sendUrgencyMail };
