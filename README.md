# 🍽️ Ruppdiun - Gestionale Ristorante (v0.0.2)

Sistema di gestione completo per ristoranti con gestione ordini in tempo reale.

## 📋 Novità Versione 0.0.2

### ✨ Modifiche Principali

1. **🆕 Nuovo Ruolo "Menu"**
   - La gestione del menu è ora separata dal ruolo Gestore
   - Interfaccia dedicata con accesso dalla home page
   - Permette di aggiungere, rimuovere e nascondere piatti
   - Gestione completa di categorie, prezzi, note e allergeni

2. **🗑️ Cancellazione Archivio**
   - Il Gestore può ora cancellare completamente l'archivio
   - Doppia conferma per evitare cancellazioni accidentali
   - Bottone dedicato nella sezione Archivio

3. **📑 Nuove Categorie Menu**
   - Le categorie sono state ampliate da 6 a 10:
     - **Coperti** (nuovo)
     - Antipasti
     - Primi
     - Secondi
     - Contorni
     - Dessert
     - **Bibite** (ex Bevande)
     - **Birre** (nuovo)
     - **Vini** (nuovo)
     - **Bar** (nuovo)
   - Le categorie Bibite, Birre, Vini e Bar vengono automaticamente instradate al terminale Bar

## 🚀 Ruoli Disponibili

### 📋 Gestore
- Visualizzazione stato tavoli
- Gestione pagamenti
- Stampa conti
- Visualizzazione e gestione archivio ordini
- Cancellazione archivio completo

### 📝 Menu (NUOVO!)
- Aggiunta nuovi piatti
- Rimozione piatti esistenti
- Nascondi/mostra piatti temporaneamente
- Gestione categorie, prezzi, note e allergeni
- Visualizzazione menu completo organizzato per categoria

### 🍽️ Cameriere
- Selezione tavolo
- Creazione ordini
- Visualizzazione menu disponibile
- Aggiunta note agli articoli
- Approvazione ordini cucina
- Annullamento ordini
- Notifiche ordini pronti
- Visualizzazione totale tavolo

### 👨‍🍳 Cucina
- Visualizzazione ordini cucina in tempo reale
- Gestione stati ordine:
  - In Attesa (richiede approvazione cameriere)
  - Nuovo
  - In Preparazione
  - Pronto
  - Annullato
- Navigazione backward tra stati
- Ordinamento ordini per recenza

### 🍹 Bar
- Visualizzazione ordini bar in tempo reale
- Gestione stati ordine:
  - Nuovo (inizio immediato)
  - In Preparazione
  - Pronto
  - Annullato
- Navigazione backward tra stati
- Ordinamento ordini per recenza

## 📦 Installazione

```bash
# Installa dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev

# Build per produzione
npm run build
```

## 🔧 Configurazione

Il progetto utilizza JSONBin per il database in tempo reale. Le credenziali sono già configurate in `src/useDatabase.js`.

## 🎨 Caratteristiche Tecniche

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS via CDN
- **Database**: JSONBin (polling ogni 2 secondi)
- **Icone**: Lucide React
- **Stato**: React Hooks

## 📱 Funzionalità Principali

- ✅ Gestione menu con 10 categorie
- ✅ Sistema multi-ruolo (5 ruoli)
- ✅ Sincronizzazione real-time
- ✅ Notifiche ordini pronti
- ✅ Stampa conti
- ✅ Archivio ordini pagati
- ✅ Gestione separata cucina/bar
- ✅ Approvazione ordini cucina da cameriere
- ✅ Navigazione backward stati ordine
- ✅ Totali automatici per tavolo
- ✅ Interfacce ottimizzate per dispositivo

## 🔄 Flusso Ordini

### Ordini Cucina
1. Cameriere crea ordine → **In Attesa**
2. Cameriere approva → **Nuovo**
3. Cucina avvia → **In Preparazione**
4. Cucina completa → **Pronto**
5. Gestore chiude conto → **Archiviato**

### Ordini Bar
1. Cameriere crea ordine → **Nuovo**
2. Bar avvia → **In Preparazione**
3. Bar completa → **Pronto**
4. Gestore chiude conto → **Archiviato**

## 📊 Gestione Archivio

- Visualizzazione cronologica ordini pagati
- Totali per ordine e dettaglio articoli
- Funzione stampa ristampa conto
- Possibilità di cancellare l'intero archivio (richiede doppia conferma)

## 🎯 Prossimi Sviluppi

- [ ] Statistiche e report
- [ ] Gestione turni
- [ ] Prenotazioni tavoli
- [ ] Sistema feedback clienti
- [ ] App mobile nativa
- [ ] Integrazione pagamenti elettronici

## 📄 Licenza

Progetto privato per uso interno.

---

Sviluppato per **Ruppdiun** 🍽️
