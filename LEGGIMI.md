# Quaderno Patentino

App per telefono (PWA) con gli appunti, i disegni e le lezioni audio per l'esame di Ufficiale di coperta.
Sito: GitHub Pages di questo repository (Settings → Pages → Branch `main`, cartella `/`).

**Versione attuale: 1.05.00 (23/11/2026).** Numerazione 1.MM.PP: media (grafica, disegni, nuovi argomenti o sezioni) → 1.MM+1.00;
piccola (pulsanti, piccole funzioni, correzioni) → 1.MM.PP+1; 2.00.00 solo per una svolta vera.
La versione sta in `strumenti/build.py` (`VER`) e in `sw.js` (`VERSIONE`): aggiornarle insieme.

## Com'è fatta
- `index.html`: tutta l'app (generata, non modificarla a mano).
- `sw.js`, `manifest.webmanifest`, `icone/`: installazione sul telefono e funzionamento senza rete.
- `esercizi/`: Assetto e pescaggi, Maree, Carteggio con carta 5D (con tasto "Quaderno" e controllo dell'accesso).
  - Assetto e pescaggi: `strumenti/assetto.html` è la stessa pagina senza controllo dell'accesso; le modifiche vanno fatte a tutte e due.
    Dal 23/11/2026 ha anche gli esercizi di pag. 216 (4, 6–14, 16–18; il 5 e il 15 hanno T<sub>m</sub> sotto la tabella) e la scheda "Movimento zavorra".
  - Maree: sorgenti in `strumenti/maree/` (`corpo.html`, `maree.js`, `extra.css`); `python3 -I strumenti/maree/gen_maree.py .` crea
    `strumenti/maree.html` (anteprima) ed `esercizi/maree.html` prendendo grafica e controllo dell'accesso da Assetto e pescaggi.
    Metodo del coseno (come il libro, Cap. 22: esercizi 2–10 tornano tutti) con controllo coi dodicesimi. Manca l'esercizio 1 (testo non fotografato).
- `frasario/`: Frasario e Traduttore SMCP (pagina a parte): `index.html` da `strumenti/fras/pagina.html`, `dati.json` e i due TSV
  del glossario generati da `strumenti/fras/lavoro/` (li legge anche la funzione `traduci`).
- `strumenti/`: sorgenti per ricostruire `index.html`.
  - `prova.html`: la nuova grafica (artefatto "Prova grafica Quaderno Patentino", anteprima 11 del 21/11/2026), contenuti del 24/10/2026.
  - `build.py`: applica le modifiche e aggiunge account, carta sinottica, esercizi. Uso: `python3 -I strumenti/build.py .`
  - `app/`: schermata d'accesso, pannello account e amministrazione (`auth.html`, `auth.css`, `auth.js`), termini di servizio (`tos.html`).
  - `nav/`: argomenti di Navigazione 1.3 (`build_nav.py`) e i loro disegni (`fig/safety.py`, `fig/altri.py`, `fig/pp_extra.py`,
    `sin/gen_oceaniche.js` per pilot chart e routeing chart: `npm i d3-geo d3-contour topojson-client world-atlas`).
  - `fras/`: Frasario. `lavoro/it_*.txt` = traduzioni italiane delle frasi (riga `numero|testo`), `generale.py`, `tavole.json`,
    `glos_smcp_it.py`, `glos_extra.txt` (803 termini). `funzione/index.ts` = sorgente della funzione Supabase `traduci` (Gemini).
  - `test_telefono.py`, `test_frasario_nav.py`: prove a misura di telefono con Supabase simulato (Playwright).

## Controllo delle bussole (in lavorazione, non ancora nell'app)
`strumenti/bussole/modello.js`: modello di calcolo (azimut al sorgere/tramonto, azimut a un istante, errori di gyro e magnetica, errore di velocità
da confermare) con effemeridi calcolate da Astronomy Engine (`lib/astronomy.browser.min.js`, MIT, ±1′). Prova: `node strumenti/bussole/prova_modello.js`.
Mancano: estratti delle effemeridi del Cap. 4 (esercizi 1–6), un esercizio svolto dal professore, gli esercizi 11–12 (pagina tagliata), la pagina.

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

## Frasario: testo inglese
Il testo inglese viene dal PDF "frasi inglesi" (Camogli, IMO Res. A.918(22)): `strumenti/fras/lavoro/smcp_layout.txt` è il suo
`pdftotext -layout`, da cui `parse_smcp.py` crea `smcp_en.json` e `glos_parse.py` crea `glos_smcp_en.json`. Il build usa
`build_dati.py` (2.265 frasi, deve dire "mancano 0"); se `smcp_en.json` manca ripiega su `build_parziale.py`.
La funzione Supabase `traduci` (sorgente `strumenti/fras/funzione/index.ts`) accetta il nuovo sito dal 22/11/2026.
Dal 23/11/2026 la traduzione è in due passi: l'app chiede insieme `modo: "veloce"` (flash-lite senza ragionamento, bozza
in ~1 s) e `modo: "preciso"` (i 4 flash più recenti con ragionamento "low", in gara: vince il primo che risponde, così un
modello sovraccarico non fa aspettare). La bozza compare subito e viene sostituita dalla traduzione accurata.

## Da recuperare
- Foto del professore come sfondo della pagina iniziale.
- Costruzione navale ed emergenze (collisione, porto): bozze mai pubblicate nella chat del 30/10/2026 (`fig/altri.py` ha già i disegni).

## App Android (APK)

- Il progetto Android è in `android/`: una WebView che apre la stessa web app (copiata negli asset a ogni build) da `https://appassets.androidplatform.net/assets/www/`.
- GitHub costruisce l'APK da solo (`.github/workflows/apk.yml`) a ogni push su `main` e la pubblica nelle **Release** con tag `apk-N` (N = 100 + numero della build).
- All'apertura l'app legge l'ultima Release e, se è più nuova, propone di aggiornarsi.
- Firma: segreti del repo `KEYSTORE_B64` e `KEYSTORE_PASS`. La chiave (alias `quaderno`) è salvata sul PC in `G:\Progetti\4. keys\Quaderno Patentino`. Senza segreti la build è solo di prova e non viene pubblicata.
- Nell'app non ci sono il tasto Installa e il service worker (riconosciuta da `QuadernoApp` nello user agent).
- Audio: partono in streaming; alla prima riproduzione un avviso chiede se scaricare la lezione per l'offline (Cache `qp-audio-off`, sia sul sito sia nell'app). Si gestiscono da Account → Audio scaricati.
