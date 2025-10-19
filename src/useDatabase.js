import { useState, useEffect } from 'react';

// IMPORTANTE: Sostituisci questi valori con i tuoi nuovi da jsonbin.io
const BIN_ID = "68f4dde3ae596e708f1ca00d";
const MASTER_KEY = "$2a$10$grxqdSInpaAGhJAk2asU7OBXiq7Jf3GcyQdIO2hRP42tzOoYCPeai";

export function useDatabase() {
  const [menu, setMenu] = useState([]);
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [barOrders, setBarOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funzione per leggere i dati
  const fetchData = async () => {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 
          "X-Master-Key": MASTER_KEY,
          "X-Access-Key": MASTER_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Verifica che i dati siano nel formato corretto
      if (data && data.record) {
        setMenu(data.record.menu || []);
        setKitchenOrders(data.record.kitchenOrders || []);
        setBarOrders(data.record.barOrders || []);
        setError(null);
      } else {
        throw new Error("Formato dati non valido");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Errore nel caricamento:", error);
      setError(error.message);
      setLoading(false);
      
      // Imposta dati vuoti di default in caso di errore
      setMenu([]);
      setKitchenOrders([]);
      setBarOrders([]);
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
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Salva i dati su JSON Bin
  const saveData = async (newMenu, newKitchenOrders, newBarOrders) => {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": MASTER_KEY,
          "X-Access-Key": MASTER_KEY
        },
        body: JSON.stringify({ 
          menu: newMenu, 
          kitchenOrders: newKitchenOrders,
          barOrders: newBarOrders
        })
      });

      if (!response.ok) {
        throw new Error(`Errore nel salvataggio: ${response.status}`);
      }
      
      console.log("Dati salvati con successo");
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      alert(`Errore nel salvataggio dei dati: ${error.message}`);
    }
  };

  return { 
    menu, 
    setMenu, 
    kitchenOrders, 
    setKitchenOrders, 
    barOrders, 
    setBarOrders, 
    loading, 
    error,
    saveData 
  };
}
