# Wolon — sito

Struttura ispirata a [noshasian.it](https://noshasian.it) (hero con CTA → piatti →
prenotazione → recensioni con rating aggregati → sede e orari → footer), con
branding Wolon: velluto verde petrolio, ottone, rovere.

## File

```
index.html
css/style.css       token, layout, componenti
js/main.js          header sticky, menu mobile, tavolo rotante, reveal
assets/logo.svg     logo monolineare (currentColor, scala senza perdita)
assets/img/         foto selezionate da /media, rinominate
.claude/launch.json config del server locale di sviluppo
```

Le foto originali restano in `media/` e non vengono toccate.

## Guardarlo

```bash
python3 -m http.server 4321
```

Poi apri <http://localhost:4321>. Serve un server (non doppio click sul file)
perché i path sono relativi.

## Il tavolo rotante

L'elemento firma del sito. Le quattro foto sono scattate dall'alto sullo stesso
tavolo di rovere: ritagliate in cerchio, il legno della foto continua nel legno
del piano, così le portate compongono un vero tavolo rotante cinese. Per questo
ci vanno **solo** scatti dall'alto su rovere: una foto su fondo bianco rompe
l'illusione e si vede subito.

Per aggiungere o togliere un piatto basta aggiungere una `<figure class="dish">`
con l'`--i` successivo e una voce in `carta` dentro `js/main.js`: il passo
angolare (`--step`) lo calcola il JS dal numero di piatti presenti, quindi CSS e
markup non possono divergere.

Si comanda in tre modi, perché il trascinamento da solo non basta
(WCAG 2.2 — ogni azione di drag vuole un'alternativa):

- trascinamento con mouse o dito, con scatto sul piatto più vicino
- frecce ‹ › ai lati
- tastiera: il piano è focusabile, frecce direzionali per girarlo

### Il tavolo non deve rubare lo scorrimento

Su telefono il piano occupa quasi tutta la larghezza: senza precauzioni, ogni
tentativo di scendere lo faceva girare. Tre difese, dalla più esterna:

1. `touch-action: pan-y` sul piano: lo scorrimento verticale resta al browser.
2. **Controllo del raggio.** Il piano è un `div` quadrato con `border-radius`,
   quindi gli angoli ricevono comunque gli eventi. `insideTable()` misura la
   distanza dal centro: fuori dal cerchio il tocco non viene nemmeno preso, e
   la pagina scorre.
3. **Gate sulla direzione.** Dentro il cerchio, ai primi 8px di movimento si
   decide: se il dito va più in verticale che in orizzontale il tavolo non si
   muove affatto. Col mouse questo gate non serve e non viene applicato.

Il nome del piatto al centro è in `aria-live="polite"`, così anche gli screen
reader annunciano il cambio.

## Contenuti da sostituire

Alcuni dati sono reali (presi da TheFork), altri sono **segnaposto inventati**:
vanno corretti prima di pubblicare.

| Contenuto | Stato |
|---|---|
| Indirizzo, Via M. Bentegodi 6, 37122 Verona | reale |
| Voto 9,4/10 · 673 recensioni · Cibo 9,5 / Servizio 9,4 / Atmosfera 9,3 | reale (TheFork) |
| Conto medio 20 € | reale |
| Le tre citazioni firmate Fabrizio F., Mattia M., Edvige G. | reali (TheFork) |
| Insalata di cetrioli 6 €, Zampe di gallina 7 €, Uovo centenario 7 € | reali |
| Nomi dei ravioli e dei piatti al wok | reali |
| **Telefono 045 123 4567** | **inventato — mettere il numero vero** |
| **info@wolon.it** | **inventato — mettere la mail vera** |
| **Orari da giovedì a domenica** | **estrapolati**: TheFork mostrava solo lun, mar e "mer chiuso" |
| **Mercoledì chiuso** | **da confermare**: un post Instagram di agosto dice "sempre aperti" |
| **Link Instagram** (`href="#"`) | **da mettere** |
| Prezzi di dim sum, wok e vini | assenti — segnati "prezzi in arrivo" |

Il menu è volutamente un abbozzo: quattro categorie con l'ossatura e i tre
antipasti di cui conosciamo i prezzi.

## Palette

Ricavata dalle fotografie della sala, non da un generatore.

| Token | Valore | Da dove viene |
|---|---|---|
| `--ink` | `#0B2122` | petrolio quasi nero, fondi scuri |
| `--teal` | `#123F41` | velluto delle sedie |
| `--brass` | `#C9A227` | profili in ottone di sedie e tavoli |
| `--oak` | `#C08B4E` | rovere dei tavoli |
| `--porcelain` | `#F5F7F5` | bianco della porcellana, fondo pagina |

Tutte le coppie testo/fondo sono state misurate: minimo rilevato 4,9:1, sopra la
soglia AA di 4,5:1. Il petrolio su ottone non regge il testo piccolo, quindi per
i corpi minuti su fondo scuro si usa `--brass-lt` (`#E3C766`, 6,1:1).

## Tipografia

- **Archivo** variabile (asse `wdth` spinto a 106–114) per i titoli — richiama il
  grottesco largo dei post Instagram e la geometria del logo
- **Instrument Sans** per il testo corrente
- **IBM Plex Mono** per dati: orari, prezzi, voti, occhielli

## Mobile

Il sito è pensato prima per il telefono, dove arriva la maggior parte del
traffico di un ristorante.

- **Barra azioni fissa in basso** con *Chiama* e *Prenota un tavolo*, sempre
  sotto il pollice. Rispetta `env(safe-area-inset-bottom)`, quindi non finisce
  sotto la home bar dell'iPhone, e il `body` ha un padding che evita che copra
  la fine del footer. Da 768px in su sparisce, perché il pulsante in header è
  già sempre visibile.
- **La barra entra solo quando il tavolo è passato.** Sui telefoni più bassi
  copriva la didascalia del piatto sotto il tavolo: ora sale quando
  `turntable.bottom < innerHeight`, cioè quando la didascalia è al sicuro. Si
  ritira anche dentro la sezione *Prenota*, dove i pulsanti grandi ci sono già.
  Per questo il CTA resta anche nell'header su mobile, con etichetta accorciata
  a "Prenota": altrimenti sulla prima schermata non ci sarebbe modo di
  prenotare senza scorrere.
- **Ordine dell'hero invertito**: titolo → tavolo rotante → testo e CTA. Su
  telefono l'immagine forte arriva subito, senza far scorrere prima un muro di
  parole. Su desktop il tavolo torna a fianco del testo (`grid-template-areas`).
- **Etichetta del piatto sotto il tavolo** invece che al centro: sotto i 768px
  non c'è spazio per entrambi. Al centro resta il perno in ottone.
- CTA a piena larghezza, uno per riga, alti 52px.
- `touch-action: manipulation` per togliere l'attesa di 300ms sul tap.
- Tutti i bersagli sopra i 24px richiesti da WCAG 2.2 per il puntatore.
- **Corpo del testo a 17px sotto i 768px.** A 19px in una colonna da 350px le
  righe scendevano a 30 caratteri: troppo spezzettate. Ora stanno fra 34 e 39,
  dentro la fascia leggibile di 35–60.
- **Le due foto della sala affiancate** invece che impilate: da sole valevano
  876px di scroll.
- Sezioni più compatte (`--section-y` a 3.25rem): la pagina è passata da 9,5 a
  **8,2 schermate**.

Verificato a 390px, 768px e 1440px: nessuno scroll orizzontale, nessun elemento
che sfora, nessuna griglia che va a capo dove non deve.

### Peso delle immagini

Da ~6 MB a **767 KB**, che su rete mobile è la differenza fra usabile e no. I
piatti del tavolo erano file da 1638×2048 mostrati a 165px: ora sono ritagli
quadrati a 400px (~40 KB l'uno). Le foto ambiente hanno il lato lungo a 900px.

Rigenerabile in qualsiasi momento dalle originali:

```
powershell -ExecutionPolicy Bypass -File tools\prepara-immagini.ps1
```

Lo script usa `System.Drawing`, integrato in Windows: nessuna dipendenza da
installare. Le originali in `media/` non vengono toccate.

## Note tecniche

- I piatti orbitano con `transform: translate() rotate() translateY()` in
  shorthand: le proprietà individuali `rotate`/`translate` si applicano in un
  ordine fisso che non produce un'orbita.
- L'hero usa un'animazione CSS al load, non `IntersectionObserver`: se
  l'observer non scatta il contenuto sopra la piega resterebbe invisibile.
  I blocchi sotto la piega usano l'observer con un failsafe a 1800 ms.
- `prefers-reduced-motion` disattiva animazioni e reveal.
- Immagini con `width`/`height` dichiarati per non generare layout shift.
- La riga in ottone sotto "autentica" usa `text-decoration` con
  `text-underline-offset`, non `box-shadow`: così si stacca dal testo e segue la
  parola invece di allargarsi a tutta la casella inline.
- `wok-crop.jpg` taglia solo la striscia in fondo all'originale: "SCORRI IL
  CAROSELLO" e la freccia partono a y=1210 e fuori da Instagram non hanno senso.
  Titolo e sottotitolo restano. Poiché l'immagine dice già "il wok è molto più
  di una padella", il titolo della sezione accanto usa l'altra frase del
  carosello, "cuoce veloce, non in fretta": la stessa riga due volte, una nella
  foto e una nell'`h2`, sarebbe stata una ripetizione.
- Nelle barre dei voti ogni cella ha `grid-area` esplicito. Lo `::before` che
  disegna la barra è il primo figlio della griglia: dandogli solo la colonna,
  `dt` e `dd` si auto-posizionavano *dopo* di lui e il valore finiva a capo.

## Da fare

- [ ] Sostituire i segnaposto della tabella qui sopra
- [ ] Convertire `assets/img/` in WebP con `srcset` (ulteriore ~30% di risparmio)
- [ ] Pagina menu completa
- [ ] FAQ, sezione storia, galleria (già valutate, rimandate)
- [ ] Dati strutturati `Restaurant` JSON-LD per la ricerca locale
