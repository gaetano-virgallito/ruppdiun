import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Clock, LogOut, Eye, EyeOff, DollarSign } from 'lucide-react';
import { useDatabase } from './useDatabase';

export default function GestionaleRistorante() {
  const { menu: dbMenu, kitchenOrders: dbKitchenOrders, barOrders: dbBarOrders, archivedOrders: dbArchivedOrders, loading, error, saveData } = useDatabase();
  
  // Stati globali
  const [role, setRole] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [menu, setMenu] = useState([]);
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [barOrders, setBarOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [hiddenDishes, setHiddenDishes] = useState([]);
  const [tables] = useState(Array.from({length: 12}, (_, i) => ({ id: i+1 })));
  const [notifications, setNotifications] = useState([]);
  const [notifiedOrders, setNotifiedOrders] = useState(new Set());
  
  // Password per accessi (MODIFICABILI)
  const PASSWORDS = {
    admin: '1234',
    cucina: 'cucina123',
    bar: 'bar123',
    cameriere: 'cameriere123',
    cameriere_bar: 'cambar123',
    menu: 'menu123'
  };
  
  // Stati per il Gestore
  const [selectedTableForPayment, setSelectedTableForPayment] = useState(null);
  const [newDish, setNewDish] = useState({ name: '', price: '', category: 'Coperti', notes: '', allergens: '' });
  const [showArchive, setShowArchive] = useState(false);
  
  // Stati per il Cameriere
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrderItems, setCurrentOrderItems] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  // Categorie menu
  const MENU_CATEGORIES = ['Coperti', 'Antipasti', 'Primi', 'Secondi', 'Contorni', 'Dessert', 'Bibite', 'Birre', 'Vini', 'Bar'];

  // Carica dati dal database
  useEffect(() => {
    setMenu(dbMenu);
  }, [dbMenu]);

  useEffect(() => {
    setKitchenOrders(dbKitchenOrders);
  }, [dbKitchenOrders]);

  useEffect(() => {
    setBarOrders(dbBarOrders);
  }, [dbBarOrders]);

  useEffect(() => {
    setArchivedOrders(dbArchivedOrders);
  }, [dbArchivedOrders]);

  // Sistema di notifiche per ordini pronti (solo per cameriere)
  useEffect(() => {
    if (role !== 'cameriere' && role !== 'cameriere_bar' && role !== 'admin') return;
    
    const allOrders = [...kitchenOrders, ...barOrders];
    const readyOrders = allOrders.filter(order => order.status === 'pronto');
    
    readyOrders.forEach(order => {
      if (!notifiedOrders.has(order.id)) {
        const newNotif = {
          id: Date.now() + Math.random(),
          orderId: order.id,
          tableId: order.tableId,
          message: `Ordine Tavolo ${order.tableId} pronto!`,
          type: order.id.endsWith('-k') ? 'cucina' : 'bar'
        };
        setNotifications(prev => [...prev, newNotif]);
        setNotifiedOrders(prev => new Set([...prev, order.id]));
      }
    });
    
    const existingOrderIds = new Set(allOrders.map(o => o.id));
    setNotifiedOrders(prev => {
      const updated = new Set([...prev].filter(id => existingOrderIds.has(id)));
      return updated;
    });
    
    setNotifications(prev => 
      prev.filter(notif => existingOrderIds.has(notif.orderId))
    );
  }, [kitchenOrders, barOrders, role]);

  // ========== FUNZIONI MENU ==========
  const addDish = async () => {
    if (newDish.name && newDish.price) {
      const newMenu = [...menu, { 
        id: Date.now().toString(), 
        name: newDish.name,
        price: parseFloat(newDish.price),
        category: newDish.category,
        notes: newDish.notes,
        allergens: newDish.allergens
      }];
      setMenu(newMenu);
      await saveData(newMenu, kitchenOrders, barOrders, archivedOrders);
      setNewDish({ name: '', price: '', category: 'Coperti', notes: '', allergens: '' });
    }
  };

  const removeDish = async (id) => {
    const newMenu = menu.filter(d => d.id !== id);
    setMenu(newMenu);
    await saveData(newMenu, kitchenOrders, barOrders, archivedOrders);
  };

  const toggleHideDish = (id) => {
    setHiddenDishes(prev => 
      prev.includes(id) ? prev.filter(hd => hd !== id) : [...prev, id]
    );
  };

  // ========== FUNZIONI ORDINI ==========
  const addToOrder = (dish) => {
    const existing = currentOrderItems.find(item => item.dishId === dish.id);
    if (existing) {
      setCurrentOrderItems(currentOrderItems.map(item =>
        item.dishId === dish.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCurrentOrderItems([...currentOrderItems, { 
        dishId: dish.id, 
        name: dish.name, 
        price: dish.price, 
        qty: 1, 
        notes: '' 
      }]);
    }
  };

  const removeFromOrder = (index) => {
    setCurrentOrderItems(currentOrderItems.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, newQty) => {
    if (newQty > 0) {
      setCurrentOrderItems(currentOrderItems.map((item, i) =>
        i === index ? { ...item, qty: newQty } : item
      ));
    }
  };

  const updateNotes = (index, notes) => {
    setCurrentOrderItems(currentOrderItems.map((item, i) =>
      i === index ? { ...item, notes } : item
    ));
  };

  const saveOrder = async () => {
    if (selectedTable && currentOrderItems.length > 0) {
      const timestamp = new Date().toLocaleTimeString('it-IT');
      const orderId = Date.now().toString();

      const kitchenItems = currentOrderItems.filter(item => {
        const dish = menu.find(d => d.id === item.dishId);
        return dish && !['Bibite', 'Birre', 'Vini', 'Bar'].includes(dish.category);
      });
      
      const barItems = currentOrderItems.filter(item => {
        const dish = menu.find(d => d.id === item.dishId);
        return dish && ['Bibite', 'Birre', 'Vini', 'Bar'].includes(dish.category);
      });

      let newKitchenOrders = kitchenOrders;
      let newBarOrders = barOrders;

      if (kitchenItems.length > 0) {
        newKitchenOrders = [...kitchenOrders, {
          id: orderId + '-k',
          tableId: selectedTable,
          items: kitchenItems,
          status: 'in_attesa',
          timestamp,
          total: kitchenItems.reduce((sum, item) => sum + item.price * item.qty, 0)
        }];
      }

      if (barItems.length > 0) {
        newBarOrders = [...barOrders, {
          id: orderId + '-b',
          tableId: selectedTable,
          items: barItems,
          status: 'nuovo',
          timestamp,
          total: barItems.reduce((sum, item) => sum + item.price * item.qty, 0)
        }];
      }

      setKitchenOrders(newKitchenOrders);
      setBarOrders(newBarOrders);
      await saveData(menu, newKitchenOrders, newBarOrders, archivedOrders);
      
      setCurrentOrderItems([]);
      setShowMenu(false);
    }
  };

  const updateKitchenOrderStatus = async (orderId, newStatus) => {
    const newKitchenOrders = kitchenOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setKitchenOrders(newKitchenOrders);
    await saveData(menu, newKitchenOrders, barOrders, archivedOrders);
  };

  const updateBarOrderStatus = async (orderId, newStatus) => {
    const newBarOrders = barOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setBarOrders(newBarOrders);
    await saveData(menu, kitchenOrders, newBarOrders, archivedOrders);
  };

  const approveKitchenOrder = async (orderId) => {
    const newKitchenOrders = kitchenOrders.map(order =>
      order.id === orderId ? { ...order, status: 'nuovo' } : order
    );
    setKitchenOrders(newKitchenOrders);
    await saveData(menu, newKitchenOrders, barOrders, archivedOrders);
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Sei sicuro di voler annullare questo ordine?')) return;
    
    if (orderId.endsWith('-k')) {
      const newKitchenOrders = kitchenOrders.map(order =>
        order.id === orderId ? { ...order, status: 'annullato' } : order
      );
      setKitchenOrders(newKitchenOrders);
      await saveData(menu, newKitchenOrders, barOrders, archivedOrders);
    } else {
      const newBarOrders = barOrders.map(order =>
        order.id === orderId ? { ...order, status: 'annullato' } : order
      );
      setBarOrders(newBarOrders);
      await saveData(menu, kitchenOrders, newBarOrders, archivedOrders);
    }
  };

  const goBackOrderStatus = async (orderId, isKitchen = true) => {
    if (isKitchen) {
      const newKitchenOrders = kitchenOrders.map(order => {
        if (order.id === orderId) {
          if (order.status === 'pronto') return { ...order, status: 'in_preparazione' };
          if (order.status === 'in_preparazione') return { ...order, status: 'nuovo' };
        }
        return order;
      });
      setKitchenOrders(newKitchenOrders);
      await saveData(menu, newKitchenOrders, barOrders, archivedOrders);
    } else {
      const newBarOrders = barOrders.map(order => {
        if (order.id === orderId) {
          if (order.status === 'pronto') return { ...order, status: 'in_preparazione' };
          if (order.status === 'in_preparazione') return { ...order, status: 'nuovo' };
        }
        return order;
      });
      setBarOrders(newBarOrders);
      await saveData(menu, kitchenOrders, newBarOrders, archivedOrders);
    }
  };

  const markAsPaid = async (tableId) => {
    const tableOrders = getTableAllOrders(tableId).filter(o => o.status !== 'annullato');
    
    if (tableOrders.length === 0) {
      alert('Non ci sono ordini da pagare per questo tavolo.');
      return;
    }
    
    const archivedRecord = {
      id: Date.now().toString(),
      tableId: tableId,
      orders: tableOrders,
      total: calculateTableTotal(tableId),
      timestamp: new Date().toLocaleString('it-IT'),
      date: new Date().toISOString()
    };
    
    const newKitchenOrders = kitchenOrders.filter(o => o.tableId !== tableId);
    const newBarOrders = barOrders.filter(o => o.tableId !== tableId);
    const newArchivedOrders = [...archivedOrders, archivedRecord];
    
    setKitchenOrders(newKitchenOrders);
    setBarOrders(newBarOrders);
    setArchivedOrders(newArchivedOrders);
    await saveData(menu, newKitchenOrders, newBarOrders, newArchivedOrders);
  };

  // ========== UTILITY ==========
  const getTableAllOrders = (tableId) => {
    return [...kitchenOrders, ...barOrders].filter(o => o.tableId === tableId);
  };

  const calculateTableTotal = (tableId) => {
    return getTableAllOrders(tableId)
      .filter(order => order.status !== 'annullato')
      .reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0), 0
      );
  };

  const closeNotification = (notifId) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const clearArchive = async () => {
    if (!confirm('Sei sicuro di voler cancellare tutto l\'archivio? Questa azione è irreversibile!')) return;
    
    const secondConfirm = prompt('Scrivi "CANCELLA" per confermare:');
    if (secondConfirm !== 'CANCELLA') return;
    
    setArchivedOrders([]);
    await saveData(menu, kitchenOrders, barOrders, []);
    alert('Archivio cancellato con successo!');
  };

  const printTableBill = (tableId) => {
    const orders = getTableAllOrders(tableId);
    const total = calculateTableTotal(tableId);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Conto Tavolo ${tableId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header { text-align: center; margin-bottom: 20px; }
          .order { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
          .order-header { font-weight: bold; background: #f0f0f0; padding: 5px; margin-bottom: 10px; }
          .item { display: flex; justify-between; padding: 5px 0; }
          .total { margin-top: 20px; padding-top: 10px; border-top: 2px solid #000; font-size: 1.2em; font-weight: bold; text-align: right; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍽️ Ruppdiun</h1>
          <p>Tavolo ${tableId} - ${new Date().toLocaleString('it-IT')}</p>
        </div>
        ${orders.map(order => `
          <div class="order">
            <div class="order-header">
              Ordine ore ${order.timestamp} - ${order.id.endsWith('-k') ? '👨‍🍳 Cucina' : '🍹 Bar'}
            </div>
            ${order.items.map(item => `
              <div class="item">
                <span>${item.qty}x ${item.name}${item.notes ? ` (${item.notes})` : ''}</span>
                <span>€ ${(item.price * item.qty).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
        <div class="total">TOTALE: € ${total.toFixed(2)}</div>
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">🖨️ Stampa</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">❌ Chiudi</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printArchivedOrder = (record) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Conto Archiviato - Tavolo ${record.tableId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header { text-align: center; margin-bottom: 20px; }
          .order { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
          .order-header { font-weight: bold; background: #f0f0f0; padding: 5px; margin-bottom: 10px; }
          .item { display: flex; justify-between; padding: 5px 0; }
          .total { margin-top: 20px; padding-top: 10px; border-top: 2px solid #000; font-size: 1.2em; font-weight: bold; text-align: right; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍽️ Ruppdiun</h1>
          <p>Tavolo ${record.tableId} - ${record.timestamp}</p>
          <p style="color: #666; font-size: 0.9em;">📦 Ordine Archiviato</p>
        </div>
        ${record.orders.map(order => `
          <div class="order">
            <div class="order-header">
              Ordine ore ${order.timestamp} - ${order.id.endsWith('-k') ? '👨‍🍳 Cucina' : '🍹 Bar'}
            </div>
            ${order.items.map(item => `
              <div class="item">
                <span>${item.qty}x ${item.name}${item.notes ? ` (${item.notes})` : ''}</span>
                <span>€ ${(item.price * item.qty).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
        <div class="total">TOTALE: € ${record.total.toFixed(2)}</div>
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">🖨️ Stampa</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">❌ Chiudi</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const logout = () => {
    setRole(null);
    setLoginError('');
    setSelectedTable(null);
    setCurrentOrderItems([]);
    setShowMenu(false);
    setSelectedTableForPayment(null);
  };

  const handleLogin = (selectedRole) => {
    const enteredPassword = prompt(`Inserisci la password per ${getRoleName(selectedRole)}:`);
    
    if (!enteredPassword) return;
    
    if (PASSWORDS[selectedRole] === enteredPassword) {
      setRole(selectedRole);
      setLoginError('');
    } else {
      setLoginError('Password errata!');
      setTimeout(() => setLoginError(''), 3000);
    }
  };

  const getRoleName = (role) => {
    const names = {
      admin: 'Amministratore',
      cucina: 'Cucina',
      bar: 'Bar',
      cameriere: 'Cameriere',
      cameriere_bar: 'Cameriere + Bar',
      menu: 'Gestione Menu'
    };
    return names[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-2xl text-gray-600">Caricamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">❌ Errore di Connessione</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Possibili cause:</strong>
            </p>
            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
              <li>Chiave API JSONBin scaduta o non valida</li>
              <li>Limiti del piano gratuito raggiunti</li>
              <li>Bin non accessibile</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            🔄 Riprova
          </button>
        </div>
      </div>
    );
  }

  // RESTO DEL CODICE CONTINUA...
  // Per motivi di spazio, continuerò nel prossimo messaggio
}
