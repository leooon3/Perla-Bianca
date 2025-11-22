import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  // Permessi (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Solo POST' });

  try {
    const { nome, voto, messaggio } = req.body;

    if (!nome || !voto || !messaggio) {
      return res.status(400).json({ message: 'Compila tutti i campi' });
    }

    // 1. Autenticazione con le variabili d'ambiente di Vercel
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 2. Carica il foglio
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByIndex[0]; // Usa il primo foglio

    // 3. Aggiungi la riga (Questi nomi devono essere IDENTICI alle colonne del tuo Excel)
    await sheet.addRow({
      'Nome e Cognome': nome,
      'Valutazione': voto,
      'Recensione': messaggio,
      'Data Soggiorno': new Date().toLocaleDateString('it-IT'),
      'Approvato': 'NO' // Importante: di default è nascosta!
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Errore API:', error);
    return res.status(500).json({ message: 'Errore interno server', error: error.message });
  }
}