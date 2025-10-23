import { useState, useEffect } from 'react';

const BIN_ID = "68f9ffd843b1c97be97a45a2";
const MASTER_KEY = "$2a$10$grxqdSInpaAGhJAk2asU7OBXiq7Jf3GcyQdIO2hRP42tzOoYCPeai";

export function useDatabase() {
  const [menu, setMenu] = useState([]);
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [barOrders, setBarOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Funzione per leggere i dati
  const fetchData = async () => {
    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        headers: { "X-Master-Key": MASTER_KEY }
      });
      const data = await response.json();
      setMenu(data.record.menu || []);
      setKitchenOrders(data.record.kitchenOrders || []);
      setBarOrders(data.record.barOrders || []);
      setArchivedOrders(data.record.archivedOrders || []);
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
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Salva i dati su JSON Bin
  const saveData = async (newMenu, newKitchenOrders, newBarOrders, newArchivedOrders) => {
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": MASTER_KEY
        },
        body: JSON.stringify({ 
          menu: newMenu, 
          kitchenOrders: newKitchenOrders,
          barOrders: newBarOrders,
          archivedOrders: newArchivedOrders
        })
      });
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
    }
  };

  return { 
    menu, 
    setMenu, 
    kitchenOrders, 
    setKitchenOrders, 
    barOrders, 
    setBarOrders,
    archivedOrders,
    setArchivedOrders,
    loading, 
    saveData 
  };
}
