import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // --- GESTIONE CORS (Headers) ---
  // Permette al browser di capire che la richiesta è autorizzata
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // In produzione, metti il tuo dominio invece di '*'
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // --- GESTIONE PREFLIGHT (OPTIONS) ---
  // Se il browser chiede "posso inviare?", rispondiamo "Sì" e chiudiamo.
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // --- CONTROLLO METODO ---
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nome, email, messaggio } = req.body;

  if (!nome || !email || !messaggio) {
    return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${nome}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      replyTo: email,
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

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email inviata con successo' });

  } catch (error) {
    console.error('Errore invio email:', error);
    // Restituiamo l'errore come JSON così il frontend non crasha
    return res.status(500).json({ message: 'Errore interno del server durante l\'invio', error: error.message });
  }
}