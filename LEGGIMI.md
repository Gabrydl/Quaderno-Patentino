# Quaderno Patentino

App per telefono (PWA) con gli appunti, i disegni e le lezioni audio per l'esame di Ufficiale di coperta.
Sito: GitHub Pages di questo repository (Settings → Pages → Branch `main`, cartella `/`).

**Versione attuale: 1.07.06 (23/11/2026).** Numerazione 1.MM.PP: media (grafica, disegni, nuovi argomenti o sezioni) → 1.MM+1.00;
piccola (pulsanti, piccole funzioni, correzioni) → 1.MM.PP+1; 2.00.00 solo per una svolta vera.
La versione sta in `strumenti/build.py` (`VER`) e in `sw.js` (`VERSIONE`): aggiornarle insieme.

## Com'è fatta
- `index.html`: tutta l'app (generata, non modificarla a mano).
- `sw.js`, `manifest.webmanifest`, `icone/`: installazione sul telefono e funzionamento senza rete.
- `esercizi/`: Assetto e pescaggi, Maree, Controllo bussole, Carteggio con carta 5D (con tasto "Quaderno" e controllo dell'accesso).
  **Dalla 1.06.00 si ricostruiscono tutte insieme con `python3 -I strumenti/esercizi/build_esercizi.py .`** (copia Assetto e Carteggio dalle
  sorgenti in `strumenti/`, lancia i generatori di Maree, Bussole e Sinottiche e aggiunge a tutte la parte comune `strumenti/esercizi/comune.css`
  e `comune.js`: tema subito senza lampo bianco, versioni interne nascoste, istruzioni «Come si fa» sotto ogni passo, formule dentro lo schermo).
  Le istruzioni «Come si fa» sono in `comune.js` (oggetto `G`, una lista per pagina, scelte dal titolo del passo).
  `esercizi/sinottiche.html`: galleria di 15 carte sinottiche Met Office a colori, generata da `strumenti/sinottiche/galleria.html` con
  `python3 -I strumenti/sinottiche/gen_sinottiche.py .` (riquadro in home e argomento "Carte sinottiche reali a colori" in Meteorologia).
  - Assetto e pescaggi e Carteggio: si modificano solo `strumenti/assetto.html` e `strumenti/carteggio.html`, poi si lancia `build_esercizi.py`.
  - Carteggio: dalla 1.07.00 il compasso è di nuovo **a circonferenza intera (stile VRM)**, come prima della 1.06.00 (richiesto dall'utente).
    Nella 1.06.00–1.06.01 c'era il compasso ad arco: il codice è nella storia git (commit 46c6f81) se servisse di nuovo.
  - (vecchia nota sull'arco)
    tipo di disegno `arc` (c, r, a0, sw); anche le costruzioni delle soluzioni usano archi intorno al punto. I vecchi cerchi salvati (`circ`) si vedono ancora.
  - Carte sinottiche a colori: dalla 1.06.01 sono un argomento di **Meteorologia** (`meteo-sinottiche-reali`), non più una pagina degli esercizi.
    `strumenti/sinottiche/gen_sinottiche.py` (lanciato da `build_esercizi.py`) crea `strumenti/sinottiche/articolo.html` e `dati/sinottiche.html`
    (le carte, scaricate solo quando si apre l'argomento); comandi in `sinottiche/sgal.css` e `sgal.js`. Testi anonimi (nessun riferimento al professore).
    Cercando «carta sinottica» esce solo questo argomento e Invio lo apre. Tasti che spariscono dopo 5 s, schermo intero con pizzica/doppio tocco/+/−.
    Dal 23/11/2026 ha anche gli esercizi di pag. 216 (4, 6–14, 16–18; il 5 e il 15 hanno T<sub>m</sub> sotto la tabella) e la scheda "Movimento zavorra".
  - Maree: sorgenti in `strumenti/maree/` (`corpo.html`, `maree.js`, `extra.css`); `python3 -I strumenti/maree/gen_maree.py .` crea
    `strumenti/maree.html` (anteprima) ed `esercizi/maree.html` prendendo grafica e controllo dell'accesso da Assetto e pescaggi.
    Metodo del coseno (come il libro, Cap. 22: esercizi 2–10 tornano tutti) con controllo coi dodicesimi. Manca l'esercizio 1 (testo non fotografato).
- `frasario/`: Frasario e Traduttore SMCP (pagina a parte): `index.html` da `strumenti/fras/pagina.html`, `dati.json` e i due TSV
  del glossario generati da `strumenti/fras/lavoro/` (li legge anche la funzione `traduci`).
- `strumenti/`: sorgenti per ricostruire `index.html`.
  - `app/presto.js` (nel `<head>` dell'app e degli esercizi): tema subito, **database dei telefoni** (Samsung, Pixel, Xiaomi/Redmi/POCO, OnePlus,
    Motorola per codice o nome; iPhone dalla misura dello schermo) con i pollici, misura reale se il modello non è noto (classi `dev-xs/s/m/l/tab`,
    variabili `--vh` e `--mm`), **potenza automatica** (classe `lite`: ≤ 4 core, ≤ 3 GB, risparmio dati, movimento ridotto, batteria ≤ 20 % non in carica,
    fotogrammi lenti; si può forzare con `localStorage['qp-potenza'] = 'lite' | 'piena'`). Il nome del telefono finisce anche nel registro accessi.
  - `app/fluido.css` e `app/fluido.js`: passaggi morbidi tra argomenti (View Transitions, se manca dissolvenza), cambio chiaro/scuro a cerchio,
    formule/calcoli/tabelle ricompattati per non scorrere mai di lato, disegni interattivi comandati solo dai cursori messi subito sotto il disegno.
  - `app/swipe.js` (1.07.00): dentro un argomento si passa al precedente/successivo trascinando il dito di lato, come tra le foto:
    parte solo oltre 26 px di lato e con movimento almeno 2,1 volte quello verticale; l'argomento segue il dito, il vicino entra dal lato
    (copia temporanea), oltre il 32 % della larghezza o con un colpo veloce si passa, altrimenti torna indietro. Escluse le zone con cursori,
    tabelle, galleria delle carte, lettore audio.
    Suggerimento muto: aprendo un argomento, l'argomento accenna uno scorrimento e compare una linguetta sul bordo destro:
    5 volte in tutto dalla prima volta che si usa l'app (`localStorage` qp-swp-hint), poi mai più.
    1.07.01: tolto lo «scatto» dopo il cambio di argomento (l'animazione d'ingresso ripartiva da sola dopo mezzo secondo).
  - `prova.html`: la nuova grafica (artefatto "Prova grafica Quaderno Patentino", anteprima 11 del 21/11/2026), contenuti del 24/10/2026.
  - `build.py`: applica le modifiche e aggiunge account, carta sinottica, esercizi. Uso: `python3 -I strumenti/build.py .`
  - `app/`: schermata d'accesso, pannello account e amministrazione (`auth.html`, `auth.css`, `auth.js`), termini di servizio (`tos.html`).
  - `nav/`: argomenti di Navigazione 1.3 (`build_nav.py`) e i loro disegni (`fig/safety.py`, `fig/altri.py`, `fig/pp_extra.py`,
    `sin/gen_oceaniche.js` per pilot chart e routeing chart: `npm i d3-geo d3-contour topojson-client world-atlas`).
  - `fras/`: Frasario. `lavoro/it_*.txt` = traduzioni italiane delle frasi (riga `numero|testo`), `generale.py`, `tavole.json`,
    `glos_smcp_it.py`, `glos_extra.txt` (803 termini). `funzione/index.ts` = sorgente della funzione Supabase `traduci` (Gemini).
  - `test_telefono.py`, `test_frasario_nav.py`: prove a misura di telefono con Supabase simulato (Playwright).

## Controllo bussole
Sorgenti in `strumenti/bussole/`: `modello.js` (calcolo), `bussole.js` (pagina), `corpo.html`, `extra.css`, `lib/astronomy.browser.min.js`
(Astronomy Engine 2.1.19, MIT, effemeridi per qualsiasi anno, ±1′). `python3 -I strumenti/bussole/gen_bussole.py .` crea `strumenti/bussole.html`
ed `esercizi/bussole.html`. Esercizi 1, 2, 4–10 del libro; gli estratti del Cap. 4 sono del 2015 (l'es. 4 torna esatto: deviazione 0,1°E).
Metodo: formula dell'ampiezza al sorgere/tramonto, formula dell'azimut a un istante; errore di velocità δv = V·cos Rv/(5π·cos φ) e
tolleranza 1° da confermare col professore. Mancano l'es. 3 (λ tagliata) e gli 11–12 (pagina tagliata). Prova: `node strumenti/bussole/prova_modello.js`.

## Carta sinottica completa (archiviata)
Dalla 1.06.00 la «Carta sinottica: esempio completo» non è più nell'app (restano le carte reali con le foto, «Fenomeni della carta sinottica» e
«Modello di stazione»). Il codice è tutto in `strumenti/sinottica.html`: per rimetterla basta `CARTA_COMPLETA = True` in `build.py`.

## Audio scaricati per l'offline
Gli audio stanno sul vecchio artefatto (`AUDIO_ORIGIN` in build.py), che non permette di scaricarli dal browser (CORS): per questo dalla 1.07.06
**nell'APK li scarica l'app** (`QPApp.scaricaAudio/audioScaricati/togliAudio/svuotaAudio` in MainActivity.java, file in `files/audio/`,
serviti alla pagina da `https://appassets.androidplatform.net/offline/…`). Dal sito la domanda «Scaricare…?» compare solo se il server
degli audio permette il download. Elenco con cestino in «Il tuo account» → Audio scaricati.

## Aggiornamento dell'APK
All'apertura l'APK controlla l'ultima Release su GitHub; se è più nuova chiama `QP_UPD()` nella pagina (`strumenti/app/aggiorna.js`):
riquadro con icona, versione, «Novità» (le righe che iniziano con «- » nel messaggio del commit, che finisce nel testo della Release),
barra di avanzamento e nota su «Installa comunque». Se la pagina non risponde usa il riquadro di Android.

## Dati d'accesso di un utente (super-admin)
Amministrazione → Utenti → tocca l'utente → **Dati d'accesso**: nuovo nome utente e/o nuova password (tasto «Genera»).
Funzione Supabase `reimposta_accesso(chi, nuovo_nome, nuova_password)`: solo super-admin, non tocca altri super-admin,
registra il cambio di nome in `nomi_storico`, con password nuova chiude le sessioni dell'utente sugli altri dispositivi.
Ogni utente può cambiare la propria password da «Il tuo account» → **Cambia password** (serve quella attuale; 1.07.04).

## Registro degli aggiornamenti
Tabella `aggiornamenti` (data, versione, descrizione) su Supabase, senza accesso diretto: la legge solo il super-admin dall'app
(Amministrazione → **Registro**, funzione `registro_aggiornamenti`). **A ogni nuova versione Claude aggiunge una riga** (con il connettore Supabase).

## Offline e velocità
`sw.js` dalla 1.06.00 serve subito la copia salvata e scarica quella nuova in sottofondo: una versione nuova si vede all'apertura successiva.
I font di Google non bloccano più la prima immagine.

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
