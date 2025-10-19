import { useState, useEffect } from 'react';

const GITHUB_REPO = "gaetano-virgallito/ruppdiun";
const GITHUB_TOKEN = "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";
const DB_FILE = "database.json";

export function useDatabase() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leggi i dati da GitHub
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${DB_FILE}`
        );
        const data = await response.json();
        const dbContent = JSON.parse(atob(data.content));
        setMenu(dbContent.menu || []);
        setOrders(dbContent.orders || []);
      } catch (error) {
        console.error("Errore nel caricamento:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Salva i dati su GitHub
  const saveData = async (newMenu, newOrders) => {
    try {
      const dbContent = { menu: newMenu, orders: newOrders };
      const encoded = btoa(JSON.stringify(dbContent, null, 2));
      
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${DB_FILE}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: "Update database",
            content: encoded
          })
        }
      );
      
      if (!response.ok) {
        console.error("Errore nel salvataggio");
      }
    } catch (error) {
      console.error("Errore:", error);
    }
  };

  return { menu, setMenu, orders, setOrders, loading, saveData };
}
