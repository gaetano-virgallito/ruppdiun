import { useState, useEffect } from 'react';

const BIN_ID = "68f4dde3ae596e708f1ca00d";
const MASTER_KEY = "$2a$10$grxqdSInpaAGhJAk2asU7OBXiq7Jf3GcyQdIO2hRP42tzOoYCPeai";

export function useDatabase() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Funzione per leggere i dati
  const fetchData = async () => {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        headers: { "X-Master-Key": MASTER_KEY }
      });
      const data = await response.json();
      setMenu(data.record.menu || []);
      setOrders(data.record.orders || []);
      setLoading(false);
    } catch (error) {
      console.error("Errore nel caricamento:", error);
    }
  };

  // Carica i dati al primo caricamento
  useEffect(() => {
    fetchData();
  }, []);

  // Polling automatico ogni 2 secondi
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 2000); // Aggiorna ogni 2 secondi

    return () => clearInterval(interval);
  }, []);

  // Salva i dati su JSON Bin
  const saveData = async (newMenu, newOrders) => {
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": MASTER_KEY
        },
        body: JSON.stringify({ menu: newMenu, orders: newOrders })
      });
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
    }
  };

  return { menu, setMenu, orders, setOrders, loading, saveData };
}
