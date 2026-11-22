# Quaderno Patentino

App per telefono (PWA) con gli appunti, i disegni e le lezioni audio per l'esame di Ufficiale di coperta.
Sito: GitHub Pages di questo repository (Settings → Pages → Branch `main`, cartella `/`).

**Versione attuale: 1.02.00 (22/11/2026).** Numerazione 1.MM.PP: media (grafica, disegni, nuovi argomenti o sezioni) → 1.MM+1.00;
piccola (pulsanti, piccole funzioni, correzioni) → 1.MM.PP+1; 2.00.00 solo per una svolta vera.
La versione sta in `strumenti/build.py` (`VER`) e in `sw.js` (`VERSIONE`): aggiornarle insieme.

## Com'è fatta
- `index.html`: tutta l'app (generata, non modificarla a mano).
- `sw.js`, `manifest.webmanifest`, `icone/`: installazione sul telefono e funzionamento senza rete.
- `esercizi/`: Assetto e pescaggi, Carteggio con carta 5D (dai loro artefatti, con tasto "Quaderno" e controllo dell'accesso).
- `strumenti/`: sorgenti per ricostruire `index.html`.
  - `prova.html`: la nuova grafica (artefatto "Prova grafica Quaderno Patentino", anteprima 11 del 21/11/2026), contenuti del 24/10/2026.
  - `build.py`: applica le modifiche e aggiunge account, carta sinottica, esercizi. Uso: `python3 -I strumenti/build.py .`
  - `app/`: schermata d'accesso, pannello account e amministrazione (`auth.html`, `auth.css`, `auth.js`), termini di servizio (`tos.html`).
  - `test_telefono.py`: prova a misura di telefono con Supabase simulato (Playwright).

## Audio
Le 168 lezioni (circa 1 GB) sono servite dal vecchio artefatto pubblico "Quaderno Patentino"
(`https://6bbf845c-0fc1-48bc-8004-6d0e2237602e.frame.claudeusercontent.com/_blob/ID`).
Se quell'artefatto viene cancellato o reso privato gli audio smettono di funzionare: spostarli in un repository a parte
(come era `Quaderno-Audio`) e cambiare `AUDIO_ORIGIN` in `build.py`.

## Account (Supabase, progetto cvyuytnouuapmazjnebc)
- Accesso con nome utente e password: l'app usa `nome@gabrydl99.github.io` come indirizzo (nessuna email inviata).
- Registrazione solo con il codice: lo controlla il database (trigger `controlla_codice_registrazione` su `auth.users`),
  il codice sta solo nella tabella `impostazioni`, mai nei file di questo repository. Lo cambiano admin e super-admin dall'app.
- Ruoli in `app_metadata.ruolo`: `superadmin` (Gabrydl) e `admin`. I permessi sono nel database (funzioni `security definer` e RLS).
- Funzioni usate dall'app: `segnale`, `conferma_messaggio`, `cambia_nome`, `salva_foto`, `elimina_account`, `elenco_utenti`,
  `registro_accessi`, `imposta_ruolo`, `elimina_utente`, `invia_messaggio`, `messaggi_inviati`, `ritira_messaggio`,
  `codice_accesso`, `cambia_codice`. Tabelle lette direttamente: `progressi`, `segnalazioni`. Allegati nel bucket `allegati`.
- Pulizia automatica (`pulizia()`, pg_cron): accessi dopo 6 mesi, messaggi dopo 12 mesi, account non usati da 12 mesi.

## Da recuperare (c'erano nella 1.01.01, il cui codice è andato perso con il vecchio account GitHub)
- Frasario e Traduttore SMCP (2.265 frasi, glossario di 801 termini, traduttore con Gemini, foto con riconoscimento del testo).
  La funzione `traduci` (Gemini) è ancora attiva su Supabase.
- Navigazione 1.3: safety contour migliorato, safety contour/safety depth/colori ECDIS, passage planning, pilot chart e routeing chart
  (testi e disegni nella chat del 30/10/2026).
- Foto del professore come sfondo della pagina iniziale.
