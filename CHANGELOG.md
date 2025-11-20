# 📝 Changelog

Tutte le modifiche importanti al progetto Ruppdiun saranno documentate in questo file.

## [0.0.2] - 2024-11-20

### ✨ Aggiunto
- **Nuovo ruolo "Menu"**: Gestione del menu spostata in un ruolo dedicato separato dal Gestore
  - Interfaccia completa per aggiungere piatti
  - Visualizzazione menu organizzato per categoria
  - Possibilità di nascondere/mostrare piatti temporaneamente
  - Eliminazione piatti dal menu
  
- **Nuove categorie menu**: Ampliate da 6 a 10 categorie
  - Coperti (nuovo)
  - Bibite (rinominata da Bevande)
  - Birre (nuovo)
  - Vini (nuovo)  
  - Bar (nuovo)
  
- **Cancellazione archivio**: Il Gestore può ora cancellare l'intero archivio
  - Bottone dedicato nella sezione Archivio
  - Doppia conferma per sicurezza
  - Feedback visivo di conferma

### 🔄 Modificato
- **Logica instradamento ordini**: Aggiornata per gestire le nuove categorie bar
  - Bibite, Birre, Vini e Bar vengono instradate al terminale Bar
  - Tutte le altre categorie vanno alla Cucina
  
- **Interfaccia Gestore**: Semplificata rimuovendo la gestione menu
  - Focus esclusivo su pagamenti e archivio
  - Layout più pulito e funzionale
  
- **Interfaccia Cameriere**: Aggiornata con le nuove categorie e colori distintivi
  - 10 categorie visualizzate con colori dedicati
  - Migliore organizzazione visiva del menu

### 🏠 Home Page
- Aggiunto bottone "📝 Menu" nella schermata di login
- Totale 5 ruoli disponibili: Gestore, Menu, Cameriere, Cucina, Bar

## [0.0.1] - 2024-11-19

### ✨ Prima release
- Sistema completo di gestione ristorante
- 4 ruoli iniziali: Gestore, Cameriere, Cucina, Bar
- Gestione ordini real-time con JSONBin
- Sistema di approvazione ordini cucina
- Notifiche ordini pronti per cameriere
- Stampa conti
- Archivio ordini pagati
- 6 categorie menu iniziali
