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

    if (!process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error('Manca la variabile GOOGLE_PRIVATE_KEY su Vercel');
    }

    // --- SOLUZIONE BASE64 (INFALLIBILE) ---
    // Decodifichiamo la stringa sicura in una chiave reale
    let privateKey;
    try {
      privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY, 'base64').toString('utf-8');
    } catch (e) {
      throw new Error('La chiave su Vercel non è in formato Base64 valido');
    }

    // Piccola pulizia extra di sicurezza nel caso la decodifica lasci residui
    if (privateKey.includes('\\n')) {
       privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // --- AUTENTICAZIONE ---
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // --- CARICAMENTO FOGLIO ---
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByIndex[0]; 

    // --- SALVATAGGIO ---
    await sheet.addRow({
      'Nome e Cognome': nome,
      'Valutazione': voto,
      'Recensione': messaggio,
      'Data Soggiorno': new Date().toLocaleDateString('it-IT'),
      'Approvato': 'NO' 
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Errore API:', error);
    return res.status(500).json({ 
        message: 'Errore interno server', 
        error: error.message
    });
  }
}