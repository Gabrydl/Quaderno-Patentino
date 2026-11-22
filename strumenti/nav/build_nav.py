# Navigazione 1.3 (ricostruita dalla chat del 30/10/2026): restituisce l'HTML dei 4 argomenti.
import os
D = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read().strip()
def fig(f, cap, cls=""): return f"<figure class=\"fig{(' ' + cls) if cls else ''}\"><div class=\"svgbox\">{rd(f)}</div><figcaption>{cap}</figcaption></figure>"
def num(n, t, d): return f'<div class="fen"><div class="fen-n">{n}</div><div class="fen-t"><b>{t}</b><span>{d}</span></div></div>'
def ul(items): return '<ul>' + ''.join(f'<li>{i}</li>' for i in items) + '</ul>'

esistente = '''<article class="topic" id="nav-safety-contour" data-p="125">
<h3>Safety contour e shallow contour<span class="pg">pag. 125</span></h3>
<p>Sono due profondità che l’ufficiale imposta sull’ECDIS in base al pescaggio della nave. L’ECDIS le usa per colorare il mare e per dare l’allarme quando la nave si avvicina all’acqua troppo bassa.</p>
<p class="f">Safety contour = max draft + squat + UKC + ZOC − tide</p>
<dl class="def">
<dt>Safety contour</dt><dd>= isobata di sicurezza: separa l’acqua dove la nave può navigare da quella dove rischia di toccare il fondo. È disegnata più spessa e, se la nave sta per attraversarla, scatta l’allarme. Se in carta non c’è un’isobata con il valore calcolato, l’ECDIS usa la prima isobata più profonda.</dd>
</dl>
<p class="f">Shallow contour = draft + UKC</p>
<dl class="def">
<dt>Shallow contour</dt><dd>= isobata dei bassi fondali: l’acqua meno profonda viene colorata di blu scuro. Serve solo per i colori, non dà allarmi.</dd>
</dl>
<h4>Le voci della formula</h4>
<dl class="def">
<dt>Max draft</dt><dd>= pescaggio massimo della nave</dd>
<dt>Squat</dt><dd>= quanto la nave affonda in più mentre naviga, per la velocità e il basso fondale</dd>
<dt>UKC</dt><dd>= under keel clearance, acqua minima da lasciare sotto la chiglia (decisa dalla compagnia o dal comandante)</dd>
<dt>ZOC</dt><dd>= margine per l’affidabilità del rilievo del fondale (CATZOC)</dd>
<dt>Tide</dt><dd>= altezza di marea sopra lo zero della carta: si sottrae perché aumenta l’acqua disponibile</dd>
</dl>
<p class="note">Esempio: pescaggio 9,0 m, squat 0,8 m, UKC 1,0 m, ZOC 0,7 m, marea 0,5 m → safety contour = 9,0 + 0,8 + 1,0 + 0,7 − 0,5 = 11 m; la carta ha le isobate di 10 e 20 m, quindi l’ECDIS usa quella di 20 m. Shallow contour = 9,0 + 1,0 = 10 m.</p>
</article>'''

safety = f'''<article class="topic" id="nav-safety-ecdis" data-p="125">
<h3>Safety contour, safety depth e colori dell’ECDIS<span class="pg">Nuovo</span></h3>
<p>Nell’ECDIS il navigante imposta alcune profondità in base al pescaggio della propria nave. Non cambiano i dati della carta: cambiano solo i colori, gli scandagli evidenziati e gli allarmi.</p>
{num(1, 'Safety contour (isobata di sicurezza)', 'Separa l’acqua sicura da quella non sicura per la nostra nave. Se in carta non c’è un’isobata con il valore impostato, l’ECDIS usa la prima isobata più profonda: imposto 11 m, la carta ha 10 e 20 m, quindi usa 20 m. È disegnata più spessa e fa scattare l’allarme se la nave sta per attraversarla; il controllo della rotta avvisa se la rotta pianificata la attraversa.')}
{num(2, 'Safety depth (profondità di sicurezza)', 'Riguarda solo gli scandagli: quelli uguali o meno profondi del valore sono scritti in nero grassetto, quelli più profondi in grigio. Non disegna linee e non dà allarmi. Di solito si mette uguale al valore del safety contour.')}
{num(3, 'Shallow contour (isobata dei bassi fondali)', 'Serve solo per i colori: l’acqua meno profonda è blu scuro.')}
{num(4, 'Deep contour (isobata delle acque profonde)', 'Serve solo per i colori: l’acqua più profonda è bianca. Si sceglie una profondità dove la nave non ha più problemi di fondale (nell’esempio 30 m).')}
{num(5, 'Pericolo isolato (isolated danger)', 'Roccia, relitto o ostruzione meno profonda del safety contour che si trova in acque più profonde, cioè nella zona azzurra o bianca: i colori non la mostrerebbero, quindi l’ECDIS la segna con un simbolo magenta e la considera negli allarmi.')}
{num(6, 'ZOC (CATZOC)', 'Indica quanto è affidabile il rilievo del fondale (da A1, il migliore, a U, non valutato). Con un rilievo poco affidabile si aggiunge un margine: è la voce ZOC nella formula.')}
{fig('fig/safety_profilo.svg', 'Il fondale visto di lato e i colori dell’ECDIS')}
{fig('fig/safety_ecdis.svg', 'Lo stesso esempio sullo schermo dell’ECDIS')}
<h4>I quattro colori</h4>
{ul(['blu scuro: meno profondo dello shallow contour;', 'blu medio: tra shallow contour e safety contour;', 'azzurro chiaro: tra safety contour e deep contour;', 'bianco: più profondo del deep contour.'])}
<p>Con la visualizzazione a due colori resta solo il safety contour: blu dove è meno profondo, bianco dove è più profondo.</p>
<h4>La differenza in breve</h4>
<div class="tbw"><table class="tb doc"><tr><th></th><th>Cosa cambia</th><th>Allarme</th></tr>
<tr><td><b>Safety contour</b></td><td>linea spessa, confine tra acqua sicura e non sicura</td><td>sì, se la nave o la rotta la attraversano</td></tr>
<tr><td><b>Safety depth</b></td><td>scandagli in grassetto o in grigio</td><td>no</td></tr>
<tr><td><b>Shallow contour</b></td><td>solo il colore blu scuro</td><td>no</td></tr>
<tr><td><b>Deep contour</b></td><td>solo il confine con il bianco</td><td>no</td></tr></table></div>
<div class="box rem"><p class="box-t"><b>Esempio</b></p><p>Nave con pescaggio 9,0 m: shallow contour 10 m; safety contour impostato 11 m, l’ECDIS usa l’isobata di 20 m; safety depth 11 m; deep contour 30 m. Una roccia a 9 m dove intorno ci sono circa 24 m è un pericolo isolato.</p></div>
</article>'''

passage = f'''<article class="topic" id="nav-passage-planning" data-p="125">
<h3>Passage planning<span class="pg">Nuovo</span></h3>
<p>Il passage plan è il piano del viaggio da banchina a banchina (berth to berth), anche nelle acque del pilota. È obbligatorio (SOLAS cap. V, regola 34) e si prepara seguendo le linee guida IMO A.893(21). Di solito lo prepara l’ufficiale di rotta e lo approva il comandante. Ha quattro fasi.</p>
{fig('fig/apem.svg', 'Le quattro fasi del passage plan')}
<h4>1 · Valutazione (appraisal)</h4>
<p>Si raccolgono e si controllano tutte le informazioni utili:</p>
{ul(['carte nautiche ed elettroniche aggiornate con gli avvisi ai naviganti;', 'portolani, elenco dei fari e segnali, radioservizi;', 'tavole di marea e di corrente; pilot chart e routeing chart per le traversate oceaniche;', 'previsioni meteo;', 'condizioni della nave: pescaggio, assetto, stabilità, manovrabilità, macchine, merci pericolose;', 'schemi di separazione del traffico, VTS, sistemi di segnalazione (ship reporting), zone protette, rischio pirateria;', 'equipaggio e turni di guardia.'])}
<h4>2 · Pianificazione (planning)</h4>
<p>Si traccia la rotta sulla carta o sull’ECDIS:</p>
{ul(['waypoint, rotte e distanze; punto di accostata (WOP) per ogni cambio di rotta;', 'margini di sicurezza e corridoio (XTD); no-go area dove l’UKC non basta;', 'UKC minimo e velocità (squat); safety contour;', 'metodi e frequenza del punto nave: punti cospicui, parallel index, rilevamenti limite;', 'punti di chiamata VTS, imbarco del pilota, cambi di carta, punti in cui chiamare il comandante;', 'punto di abort (ultimo punto per rinunciare) e ancoraggi d’emergenza; piani di contingenza; ETA.'])}
{fig('fig/passage_plan.svg', 'Passage plan su carta')}
{fig('fig/wop.svg', 'WOP: dove si dà il timone per accostare')}
<h4>3 · Esecuzione (execution)</h4>
{ul(['il comandante approva il piano; ogni modifica va approvata;', 'si decidono velocità ed ETA tenendo conto di marea, correnti e meteo;', 'briefing con gli ufficiali di guardia (bridge team) e prove delle apparecchiature prima della partenza;', 'si segue il piano e si chiama il comandante nei punti stabiliti.'])}
<h4>4 · Monitoraggio (monitoring)</h4>
{ul(['posizione controllata di continuo con almeno due metodi indipendenti (ad esempio GPS e radar o rilevamenti);', 'confronto con la rotta pianificata: scarto laterale (XTE) dentro il corridoio;', 'controllo di UKC, meteo, ETA e allarmi dell’ECDIS;', 'registrazione sul giornale nautico; se le condizioni cambiano si aggiorna il piano.'])}
<h4>Termini da sapere</h4>
<dl class="def">
<dt>UKC (under keel clearance)</dt><dd>= acqua sotto la chiglia: fondale di carta + marea − pescaggio − squat. Deve restare sopra il minimo deciso nel piano.</dd>
<dt>WOP (wheel over point)</dt><dd>= punto in cui si dà il timone per accostare, prima del waypoint: la nave non gira sul posto ma descrive un arco (vedi curva di evoluzione). Distanza dal WP = tempo di risposta + r · tan(Δ/2).</dd>
<dt>Parallel index</dt><dd>= linea tracciata sul radar parallela alla rotta, alla distanza a cui deve passare un punto cospicuo: se l’eco scorre sulla linea la nave è in rotta, se entra la nave si sta avvicinando.</dd>
<dt>Rilevamento limite</dt><dd>= rilevamento di un faro o punto cospicuo da non superare (NMT) o sotto cui non scendere (NLT) per restare lontani da un pericolo.</dd>
<dt>Abort point</dt><dd>= ultimo punto in cui si può ancora rinunciare all’entrata in un passaggio stretto o in un porto; dopo bisogna proseguire.</dd>
</dl>
</article>'''

carte = f'''<article class="topic" id="nav-pilot-routeing" data-p="125">
<h3>Pilot chart e routeing chart<span class="pg">Nuovo</span></h3>
<p>Sono carte a piccola scala di un intero oceano, una per ogni mese dell’anno, con le condizioni medie (climatologiche) di quel mese: venti, correnti, onde, ghiacci, visibilità. Si usano nella fase di valutazione e pianificazione del passage plan per scegliere la rotta oceanica. Non servono per navigare né per fare il punto nave.</p>
<h4>Pilot chart</h4>
<p>Pubblicate dagli Stati Uniti (NGA, Atlas of Pilot Charts), divise per oceano, 12 carte per volume.</p>
{ul(['<b>Rose dei venti</b> in ogni quadrato di 5°: le frecce “volano col vento” verso il centro; la lunghezza è la frequenza (%) del vento da quella direzione, il numero di piume è la forza Beaufort media, il numero nel cerchio è la % di calme. Se la freccia è troppo lunga è interrotta e c’è scritta la %.', '<b>Correnti</b>: frecce verdi con la velocità media in nodi.', '<b>Linee rosse</b>: percentuale di onde alte 12 piedi (circa 3,7 m) o più.', '<b>Limiti medi dei ghiacci</b> (iceberg e banchisa).', '<b>Linee isogone</b>: declinazione magnetica.', '<b>Rotte per cerchio massimo</b> tra i porti principali, con la distanza.', '<b>Riquadri piccoli</b>: burrasche, visibilità ridotta, tracce dei cicloni, pressione e temperature medie di aria e mare.'])}
{fig('sin/pilot_chart.svg', 'Pilot chart d’esempio · Atlantico del Nord, gennaio')}
<p class="note">Esempio costruito per lo studio: coste vere, valori medi indicativi (la declinazione magnetica è approssimata).</p>
{num(1, 'Rosa dei venti', 'Fascia degli alisei: vento da NE nel 46% dei casi, forza media 5, calme 2%.')}
{num(2, 'Onde alte', 'A sud dell’Islanda in gennaio fino al 40% delle osservazioni ha onde di 12 piedi o più.')}
{num(3, 'Corrente del Golfo', 'Corrente calda verso NE, circa 2 nodi; nello stretto della Florida 2,5 nodi.')}
{num(4, 'Limiti dei ghiacci', 'Limite medio degli iceberg sui Banchi di Terranova e limite della banchisa lungo il Labrador.')}
{num(5, 'Declinazione magnetica', 'Linee isogone viola tratteggiate: da 0° vicino al Portogallo a oltre 20°W verso la Groenlandia.')}
{num(6, 'Rotte per cerchio massimo', 'New York – Bishop Rock 2807 miglia, New York – Gibilterra 3141 miglia.')}
<h4>Routeing chart</h4>
<p>Pubblicate dal Regno Unito (UKHO, Admiralty), 12 carte per ogni oceano, una per mese, più carte a scala maggiore per le zone di traffico intenso.</p>
{ul(['<b>Rotte raccomandate</b> tra i porti principali, con le distanze in miglia.', '<b>Limiti delle zone del bordo libero</b> (Convenzione Load Lines 1966): dicono quale marca di bordo libero si può usare in quel mese.', '<b>Limiti dei ghiacci, correnti prevalenti e rose dei venti</b> (come leggerle è spiegato nella legenda di ogni carta).', '<b>Riquadri piccoli</b>: temperature dell’aria e del mare, pressione, nebbia e visibilità, tempeste tropicali.'])}
{fig('sin/routeing_chart.svg', 'Routeing chart d’esempio · Atlantico del Nord, gennaio')}
{num(1, 'Rotte raccomandate', 'New York → 41°N 50°W → Bishop Rock: 1081 + 1880 miglia. In inverno la rotta passa a sud del limite dei ghiacci.')}
{num(2, 'Zona stagionale invernale I', 'Inverno dal 16 ottobre al 15 aprile. Nella zona II l’inverno va dal 16 novembre al 15 marzo: a gennaio si usa la marca invernale in entrambe. Le navi lunghe fino a 100 m usano la marca WNA nella zona I e nella zona II tra 15°W e 50°W.')}
{num(3, 'Zona tropicale', 'Il limite nord nell’Atlantico segue 13°N, 10°N, il meridiano 20°W fino a 30°N e poi 30°N fino all’Africa. In mezzo c’è la zona estiva, valida tutto l’anno.')}
{num(4, 'Ghiacci', 'Limite medio degli iceberg e della banchisa nel mese.')}
{num(5, 'Rosa dei venti', 'Frequenza del vento da ogni direzione; il numero al centro è la percentuale di calme.')}
{num(6, 'Correnti prevalenti', 'Direzione prevalente e velocità media in nodi (Corrente del Golfo).')}
<h4>La differenza</h4>
<div class="tbw"><table class="tb doc"><tr><th></th><th>Pilot chart</th><th>Routeing chart</th></tr>
<tr><td><b>Chi la fa</b></td><td>Stati Uniti (NGA)</td><td>Regno Unito (Admiralty)</td></tr>
<tr><td><b>A cosa serve di più</b></td><td>statistiche meteo-marine dettagliate per quadrati di 5°</td><td>scegliere la rotta: rotte raccomandate con distanze</td></tr>
<tr><td><b>Rose dei venti</b></td><td>in ogni quadrato di 5°, piume = forza Beaufort</td><td>meno fitte, forza spiegata in legenda</td></tr>
<tr><td><b>Zone del bordo libero</b></td><td>no</td><td>sì</td></tr>
<tr><td><b>Altro</b></td><td>onde alte, declinazione magnetica</td><td>riquadri con temperature, nebbia, tempeste</td></tr></table></div>
<div class="box easy"><p class="box-t"><b>In comune</b></p><p>Una carta per ogni mese, valori medi di molti anni, piccola scala: si usano per pianificare la traversata oceanica (fase di valutazione e pianificazione del passage plan), mai per navigare.</p></div>
</article>'''

def articoli(): return esistente, '\n\n'.join([safety, passage, carte])
