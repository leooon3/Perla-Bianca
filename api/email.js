// api/email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Accetta solo richieste POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nome, email, messaggio } = req.body;

  if (!nome || !email || !messaggio) {
    return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
  }

  try {
    // Configura il "trasportatore" (chi invia la mail)
    // Qui usiamo le Variabili d'Ambiente per non scrivere la password nel codice
    const transporter = nodemailer.createTransport({
      service: 'gmail', // O 'hotmail', 'yahoo', ecc. o host SMTP personalizzato
      auth: {
        user: process.env.EMAIL_USER, // La tua mail (es. perlabianca@gmail.com)
        pass: process.env.EMAIL_PASS, // La tua "App Password" (NON la password normale)
      },
    });

    // Configura il messaggio
    const mailOptions = {
      from: `"${nome}" <${process.env.EMAIL_USER}>`, // Mittente fittizio
      to: process.env.EMAIL_TO, // A chi arriva la mail (tu)
      replyTo: email, // Se rispondi, rispondi all'utente
      subject: `Nuovo messaggio dal sito da: ${nome}`,
      text: `Hai ricevuto un nuovo messaggio:\n\nNome: ${nome}\nEmail: ${email}\n\nMessaggio:\n${messaggio}`,
      html: `
        <h3>Nuovo messaggio da Perla Bianca</h3>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Messaggio:</strong></p>
        <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
          ${messaggio.replace(/\n/g, '<br>')}
        </blockquote>
      `,
    };

    // Invia
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email inviata con successo' });

  } catch (error) {
    console.error('Errore invio email:', error);
    return res.status(500).json({ message: 'Errore interno del server' });
  }
}