 import React, { useState, useEffect } from 'react';
 import { Plus, Trash2, Check, Clock, LogOut, Eye, EyeOff, DollarSign } from 'lucide-react';
 import { useDatabase } from './useDatabase';
 
+const CATEGORIES = ['Coperti', 'Antipasti', 'Primi', 'Secondi', 'Contorni', 'Dessert', 'Bibite', 'Birre', 'Vini', 'Bar'];
+const BAR_CATEGORIES = ['Bibite', 'Birre', 'Vini', 'Bar', 'Bevande'];
+
+const SECTION_LABELS = {
+  gestore: 'Gestore',
+  menu: 'Gestione Menu',
+  cameriere: 'Cameriere',
+  cucina: 'Cucina',
+  bar: 'Bar'
+};
+
 export default function GestionaleRistorante() {
   const { menu: dbMenu, kitchenOrders: dbKitchenOrders, barOrders: dbBarOrders, archivedOrders: dbArchivedOrders, loading, error, saveData } = useDatabase();
   
   // Stati globali
+  const [accessType, setAccessType] = useState(null);
+  const [allowedSections, setAllowedSections] = useState([]);
   const [role, setRole] = useState(null);
   const [menu, setMenu] = useState([]);
   const [kitchenOrders, setKitchenOrders] = useState([]);
   const [barOrders, setBarOrders] = useState([]);
   const [archivedOrders, setArchivedOrders] = useState([]);
   const [hiddenDishes, setHiddenDishes] = useState([]);
   const [tables] = useState(Array.from({length: 12}, (_, i) => ({ id: i+1 })));
   const [notifications, setNotifications] = useState([]);
   const [notifiedOrders, setNotifiedOrders] = useState(new Set());
+
+  const accessConfigurations = {
+    completo: {
+      label: 'Accesso Completo',
+      sections: ['gestore', 'menu', 'cameriere', 'cucina', 'bar']
+    },
+    gestore: { label: 'Gestore - Cassa', sections: ['gestore'] },
+    menu: { label: 'Gestione Menu', sections: ['menu'] },
+    cameriere: { label: 'Cameriere', sections: ['cameriere'] },
+    cucina: { label: 'Cucina', sections: ['cucina'] },
+    bar: { label: 'Bar', sections: ['bar'] },
+    cameriereBar: { label: 'Cameriere + Bar', sections: ['cameriere', 'bar'] }
+  };
   
   // Stati per il Gestore
   const [selectedTableForPayment, setSelectedTableForPayment] = useState(null);
   const [newDish, setNewDish] = useState({ name: '', price: '', category: 'Antipasti', notes: '', allergens: '' });
   const [showArchive, setShowArchive] = useState(false);
   
   // Stati per il Cameriere
   const [selectedTable, setSelectedTable] = useState(null);
   const [currentOrderItems, setCurrentOrderItems] = useState([]);
   const [showMenu, setShowMenu] = useState(false);
 
+  const startAccess = (type) => {
+    const config = accessConfigurations[type];
+    if (!config) return;
+
+    setAccessType(type);
+    setAllowedSections(config.sections);
+    setRole(config.sections[0]);
+
+    // reset context-specific UI states
+    setSelectedTable(null);
+    setSelectedTableForPayment(null);
+    setCurrentOrderItems([]);
+    setShowMenu(false);
+    setShowArchive(false);
+  };
+
+  const renderSectionTabs = () => {
+    if (!allowedSections.length || !role) return null;
+
+    const currentAccessLabel = accessConfigurations[accessType]?.label;
+
+    return (
+      <div className="mb-6">
+        {currentAccessLabel && (
+          <p className="text-sm text-gray-600 mb-2">Accesso attivo: {currentAccessLabel}</p>
+        )}
+        <div className="flex flex-wrap gap-2">
+          {allowedSections.map(section => (
+            <button
+              key={section}
+              onClick={() => setRole(section)}
+              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
+                role === section
+                  ? 'bg-gray-900 text-white shadow'
+                  : 'bg-white/70 text-gray-700 hover:bg-white shadow'
+              }`}
+            >
+              {SECTION_LABELS[section] || section}
+            </button>
+          ))}
+        </div>
+      </div>
+    );
+  };
+
+  const getOrderedCategories = () => {
+    const extras = Array.from(new Set(menu.map(dish => dish.category))).filter(cat => !CATEGORIES.includes(cat));
+    return [...CATEGORIES, ...extras];
+  };
+
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
     if (role !== 'cameriere') return;
     
     const allOrders = [...kitchenOrders, ...barOrders];
     const readyOrders = allOrders.filter(order => order.status === 'pronto');
     
     readyOrders.forEach(order => {
@@ -130,56 +206,56 @@ export default function GestionaleRistorante() {
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
       const total = currentOrderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
 
       // Separa ordini cucina e bar
       const kitchenItems = currentOrderItems.filter(item => {
         const dish = menu.find(d => d.id === item.dishId);
-        return dish && dish.category !== 'Bevande';
+        return dish && !BAR_CATEGORIES.includes(dish.category);
       });
-      
+
       const barItems = currentOrderItems.filter(item => {
         const dish = menu.find(d => d.id === item.dishId);
-        return dish && dish.category === 'Bevande';
+        return dish && BAR_CATEGORIES.includes(dish.category);
       });
 
       let newKitchenOrders = kitchenOrders;
       let newBarOrders = barOrders;
 
       // Cucina: stato "in_attesa" - richiede approvazione cameriere
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
 
       // Bar: stato "nuovo" - preparazione immediata
       if (barItems.length > 0) {
         newBarOrders = [...barOrders, {
           id: orderId + '-b',
           tableId: selectedTable,
           items: barItems,
           status: 'nuovo',
           timestamp,
@@ -272,50 +348,57 @@ export default function GestionaleRistorante() {
       alert('Non ci sono ordini da pagare per questo tavolo.');
       return;
     }
     
     // Crea record archivio
     const archivedRecord = {
       id: Date.now().toString(),
       tableId: tableId,
       orders: tableOrders,
       total: calculateTableTotal(tableId),
       timestamp: new Date().toLocaleString('it-IT'),
       date: new Date().toISOString()
     };
     
     // Rimuovi ordini pagati e aggiungi all'archivio
     const newKitchenOrders = kitchenOrders.filter(o => o.tableId !== tableId);
     const newBarOrders = barOrders.filter(o => o.tableId !== tableId);
     const newArchivedOrders = [...archivedOrders, archivedRecord];
     
     setKitchenOrders(newKitchenOrders);
     setBarOrders(newBarOrders);
     setArchivedOrders(newArchivedOrders);
     await saveData(menu, newKitchenOrders, newBarOrders, newArchivedOrders);
   };
 
+  const clearArchive = async () => {
+    if (!confirm('Sei sicuro di voler cancellare tutti i dati dell\'archivio?')) return;
+
+    setArchivedOrders([]);
+    await saveData(menu, kitchenOrders, barOrders, []);
+  };
+
   // ========== UTILITY ==========
   const getTableAllOrders = (tableId) => {
     return [...kitchenOrders, ...barOrders].filter(o => o.tableId === tableId);
   };
 
   const calculateTableTotal = (tableId) => {
     return getTableAllOrders(tableId)
       .filter(order => order.status !== 'annullato') // Escludi ordini annullati
       .reduce((sum, order) => 
         sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0), 0
       );
   };
 
   const closeNotification = (notifId) => {
     setNotifications(prev => prev.filter(n => n.id !== notifId));
   };
 
   const printTableBill = (tableId) => {
     const orders = getTableAllOrders(tableId);
     const total = calculateTableTotal(tableId);
     
     const printWindow = window.open('', '_blank');
     printWindow.document.write(`
       <!DOCTYPE html>
       <html>
@@ -404,266 +487,303 @@ export default function GestionaleRistorante() {
               <div class="item">
                 <span>${item.qty}x ${item.name}${item.notes ? ` (${item.notes})` : ''}</span>
                 <span>€ ${(item.price * item.qty).toFixed(2)}</span>
               </div>
             `).join('')}
           </div>
         `).join('')}
         <div class="total">
           TOTALE: € ${record.total.toFixed(2)}
         </div>
         <div style="text-align: center; margin-top: 30px;">
           <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
             🖨️ Stampa
           </button>
           <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">
             ❌ Chiudi
           </button>
         </div>
       </body>
       </html>
     `);
     printWindow.document.close();
   };
 
   const logout = () => {
+    setAccessType(null);
+    setAllowedSections([]);
     setRole(null);
     setSelectedTable(null);
     setCurrentOrderItems([]);
     setShowMenu(false);
     setSelectedTableForPayment(null);
+    setShowArchive(false);
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
 
+  // ========================================
+  // GESTIONE MENU
+  // ========================================
+  if (role === 'menu') {
+    const orderedCategories = getOrderedCategories();
+
+    return (
+      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
+        <div className="max-w-6xl mx-auto">
+          {renderSectionTabs()}
+          <div className="flex justify-between items-center mb-6">
+            <h1 className="text-3xl font-bold text-blue-900">📖 Gestione Menu</h1>
+            <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
+              <LogOut size={18} /> Esci
+            </button>
+          </div>
+
+          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
+            {/* Form Aggiungi Piatto */}
+            <div className="bg-white rounded-lg shadow-lg p-6">
+              <h2 className="text-xl font-semibold text-gray-800 mb-4">Aggiungi Piatto</h2>
+              <div className="space-y-3">
+                <input
+                  type="text"
+                  placeholder="Nome piatto"
+                  value={newDish.name}
+                  onChange={(e) => setNewDish({...newDish, name: e.target.value})}
+                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
+                />
+                <input
+                  type="number"
+                  placeholder="Prezzo (€)"
+                  value={newDish.price}
+                  onChange={(e) => setNewDish({...newDish, price: e.target.value})}
+                  step="0.10"
+                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
+                />
+                <select
+                  value={newDish.category}
+                  onChange={(e) => setNewDish({...newDish, category: e.target.value})}
+                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
+                >
+                  {orderedCategories.map(category => (
+                    <option key={category}>{category}</option>
+                  ))}
+                </select>
+                <input
+                  type="text"
+                  placeholder="Note (es. senza glutine)"
+                  value={newDish.notes}
+                  onChange={(e) => setNewDish({...newDish, notes: e.target.value})}
+                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
+                />
+                <input
+                  type="text"
+                  placeholder="Allergeni (es. arachidi)"
+                  value={newDish.allergens}
+                  onChange={(e) => setNewDish({...newDish, allergens: e.target.value})}
+                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
+                />
+                <button
+                  onClick={addDish}
+                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
+                >
+                  <Plus size={20} /> Aggiungi
+                </button>
+              </div>
+            </div>
+
+            {/* Lista Menu */}
+            <div className="bg-white rounded-lg shadow-lg p-6 max-h-[600px] overflow-y-auto">
+              <div className="flex items-center justify-between mb-4">
+                <div>
+                  <h2 className="text-lg font-semibold text-gray-800">Menu ({menu.length})</h2>
+                  <p className="text-sm text-gray-500">Gestisci visibilità, prezzi e categorie</p>
+                </div>
+                <div className="text-right">
+                  <p className="text-xs text-gray-500">Categorie bar:</p>
+                  <p className="text-sm font-semibold text-cyan-700">{BAR_CATEGORIES.join(', ')}</p>
+                </div>
+              </div>
+
+              {menu.length === 0 ? (
+                <p className="text-gray-500 text-sm">Nessun piatto</p>
+              ) : (
+                <div className="space-y-4">
+                  {orderedCategories.map(cat => {
+                    const items = menu.filter(d => d.category === cat);
+                    if (items.length === 0) return null;
+                    return (
+                      <div key={cat}>
+                        <h3 className="font-bold text-gray-700 text-sm mb-2 border-b-2 pb-1">{cat}</h3>
+                        {items.map(dish => (
+                          <div key={dish.id} className={`p-2 mb-2 rounded ${hiddenDishes.includes(dish.id) ? 'bg-gray-200 opacity-50' : 'bg-gray-50'}`}>
+                            <div className="flex justify-between items-start gap-2">
+                              <div className="flex-1">
+                                <p className={`font-semibold text-sm ${hiddenDishes.includes(dish.id) ? 'line-through text-gray-500' : 'text-gray-800'}`}>
+                                  {dish.name}
+                                </p>
+                                <p className="text-green-600 font-bold text-sm">€{dish.price.toFixed(2)}</p>
+                                {dish.notes && <p className="text-xs text-blue-600 mt-1">ℹ️ {dish.notes}</p>}
+                                {dish.allergens && <p className="text-xs text-red-600 mt-1">⚠️ {dish.allergens}</p>}
+                              </div>
+                              <div className="flex gap-1">
+                                <button
+                                  onClick={() => toggleHideDish(dish.id)}
+                                  className={`px-2 py-1 text-xs rounded font-bold ${hiddenDishes.includes(dish.id) ? 'bg-yellow-500 text-white' : 'bg-gray-400 text-white'}`}
+                                >
+                                  {hiddenDishes.includes(dish.id) ? '👁️' : '🚫'}
+                                </button>
+                                <button
+                                  onClick={() => removeDish(dish.id)}
+                                  className="px-2 py-1 bg-red-500 text-white text-xs rounded"
+                                >
+                                  🗑️
+                                </button>
+                              </div>
+                            </div>
+                          </div>
+                        ))}
+                      </div>
+                    );
+                  })}
+                </div>
+              )}
+            </div>
+          </div>
+        </div>
+      </div>
+    );
+  }
+
   // ========================================
   // GESTORE
   // ========================================
   if (role === 'gestore') {
     const tableOrders = selectedTableForPayment ? getTableAllOrders(selectedTableForPayment) : [];
     const totalAmount = selectedTableForPayment ? calculateTableTotal(selectedTableForPayment) : 0;
 
     return (
       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
         <div className="max-w-6xl mx-auto">
+          {renderSectionTabs()}
           {/* Header */}
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-blue-900">📋 Gestore - Cassa</h1>
             <div className="flex gap-2">
-              <button 
-                onClick={() => setShowArchive(!showArchive)} 
+              <button
+                onClick={() => setShowArchive(!showArchive)}
                 className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
               >
                 📦 {showArchive ? 'Nascondi' : 'Archivio'}
               </button>
+              <button
+                onClick={clearArchive}
+                className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
+              >
+                🗑️ Svuota archivio
+              </button>
               <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                 <LogOut size={18} /> Esci
               </button>
             </div>
           </div>
 
           {/* Archivio Ordini Pagati */}
           {showArchive && (
             <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
               <h2 className="text-xl font-semibold text-gray-800 mb-4">📦 Archivio Ordini Pagati</h2>
               {archivedOrders.length === 0 ? (
                 <p className="text-gray-500 text-center py-4">Nessun ordine nell'archivio</p>
               ) : (
                 <div className="space-y-4 max-h-96 overflow-y-auto">
                   {archivedOrders.slice().reverse().map(record => (
                     <div key={record.id} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-lg">
                       <div className="flex justify-between items-start mb-2">
                         <div>
                           <p className="font-bold text-gray-800">Tavolo {record.tableId}</p>
                           <p className="text-sm text-gray-600">{record.timestamp}</p>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-xl font-bold text-green-600">€ {record.total.toFixed(2)}</span>
                           <button
                             onClick={() => printArchivedOrder(record)}
                             className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition"
                           >
                             🖨️ Stampa
                           </button>
                         </div>
                       </div>
                       <div className="text-sm text-gray-700">
                         {record.orders.map((order, idx) => (
                           <div key={idx} className="mt-2">
                             <p className="font-semibold">{order.id.endsWith('-k') ? '👨‍🍳 Cucina' : '🍹 Bar'} - {order.timestamp}</p>
                             {order.items.map((item, i) => (
                               <p key={i} className="ml-4">{item.qty}x {item.name} - € {(item.price * item.qty).toFixed(2)}</p>
                             ))}
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
 
-          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
-            {/* Sezione Menu */}
-            <div className="lg:col-span-1">
-              {/* Form Aggiungi Piatto */}
-              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
-                <h2 className="text-xl font-semibold text-gray-800 mb-4">Aggiungi Piatto</h2>
-                <div className="space-y-3">
-                  <input 
-                    type="text" 
-                    placeholder="Nome piatto" 
-                    value={newDish.name} 
-                    onChange={(e) => setNewDish({...newDish, name: e.target.value})} 
-                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
-                  />
-                  <input 
-                    type="number" 
-                    placeholder="Prezzo (€)" 
-                    value={newDish.price} 
-                    onChange={(e) => setNewDish({...newDish, price: e.target.value})} 
-                    step="0.10" 
-                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
-                  />
-                  <select 
-                    value={newDish.category} 
-                    onChange={(e) => setNewDish({...newDish, category: e.target.value})} 
-                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
-                  >
-                    <option>Antipasti</option>
-                    <option>Primi</option>
-                    <option>Secondi</option>
-                    <option>Contorni</option>
-                    <option>Dessert</option>
-                    <option>Bevande</option>
-                  </select>
-                  <input 
-                    type="text" 
-                    placeholder="Note (es. senza glutine)" 
-                    value={newDish.notes} 
-                    onChange={(e) => setNewDish({...newDish, notes: e.target.value})} 
-                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
-                  />
-                  <input 
-                    type="text" 
-                    placeholder="Allergeni (es. arachidi)" 
-                    value={newDish.allergens} 
-                    onChange={(e) => setNewDish({...newDish, allergens: e.target.value})} 
-                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
-                  />
-                  <button 
-                    onClick={addDish} 
-                    className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
-                  >
-                    <Plus size={20} /> Aggiungi
-                  </button>
-                </div>
-              </div>
-
-              {/* Lista Menu */}
-              <div className="bg-white rounded-lg shadow-lg p-6 max-h-96 overflow-y-auto">
-                <h2 className="text-lg font-semibold text-gray-800 mb-4">Menu ({menu.length})</h2>
-                {menu.length === 0 ? (
-                  <p className="text-gray-500 text-sm">Nessun piatto</p>
-                ) : (
-                  <div className="space-y-4">
-                    {['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Dessert', 'Bevande'].map(cat => {
-                      const items = menu.filter(d => d.category === cat);
-                      if (items.length === 0) return null;
-                      return (
-                        <div key={cat}>
-                          <h3 className="font-bold text-gray-700 text-sm mb-2 border-b-2 pb-1">{cat}</h3>
-                          {items.map(dish => (
-                            <div key={dish.id} className={`p-2 mb-2 rounded ${hiddenDishes.includes(dish.id) ? 'bg-gray-200 opacity-50' : 'bg-gray-50'}`}>
-                              <div className="flex justify-between items-start gap-2">
-                                <div className="flex-1">
-                                  <p className={`font-semibold text-sm ${hiddenDishes.includes(dish.id) ? 'line-through text-gray-500' : 'text-gray-800'}`}>
-                                    {dish.name}
-                                  </p>
-                                  <p className="text-green-600 font-bold text-sm">€{dish.price.toFixed(2)}</p>
-                                  {dish.notes && <p className="text-xs text-blue-600 mt-1">ℹ️ {dish.notes}</p>}
-                                  {dish.allergens && <p className="text-xs text-red-600 mt-1">⚠️ {dish.allergens}</p>}
-                                </div>
-                                <div className="flex gap-1">
-                                  <button 
-                                    onClick={() => toggleHideDish(dish.id)} 
-                                    className={`px-2 py-1 text-xs rounded font-bold ${hiddenDishes.includes(dish.id) ? 'bg-yellow-500 text-white' : 'bg-gray-400 text-white'}`}
-                                  >
-                                    {hiddenDishes.includes(dish.id) ? '👁️' : '🚫'}
-                                  </button>
-                                  <button 
-                                    onClick={() => removeDish(dish.id)} 
-                                    className="px-2 py-1 bg-red-500 text-white text-xs rounded"
-                                  >
-                                    🗑️
-                                  </button>
-                                </div>
-                              </div>
-                            </div>
-                          ))}
-                        </div>
-                      );
-                    })}
-                  </div>
-                )}
-              </div>
-            </div>
-
+          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Sezione Tavoli e Pagamenti */}
             <div className="lg:col-span-2">
               <div className="bg-white rounded-lg shadow-lg p-6">
                 <h2 className="text-xl font-semibold text-gray-800 mb-4">Tavoli - Gestione Pagamenti</h2>
                 
                 {/* Griglia Tavoli */}
                 <div className="grid grid-cols-4 gap-3 mb-6">
                   {tables.map(table => {
                     const hasOrders = getTableAllOrders(table.id).length > 0;
                     return (
                       <button
                         key={table.id}
                         onClick={() => setSelectedTableForPayment(selectedTableForPayment === table.id ? null : table.id)}
                         className={`p-4 rounded-lg font-bold transition ${
                           selectedTableForPayment === table.id
                             ? 'bg-blue-500 text-white ring-2 ring-blue-700'
                             : hasOrders
                             ? 'bg-red-100 text-red-800 hover:bg-red-200'
                             : 'bg-green-100 text-green-800 hover:bg-green-200'
                         }`}
                       >
                         T{table.id}
                         {hasOrders && <div className="text-xs mt-1">({getTableAllOrders(table.id).length})</div>}
                       </button>
                     );
@@ -734,54 +854,56 @@ export default function GestionaleRistorante() {
                             <button
                               onClick={() => markAsPaid(selectedTableForPayment)}
                               className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition flex items-center justify-center gap-2 text-sm"
                             >
                               <DollarSign size={20} /> Pagato
                             </button>
                           </div>
                         </div>
                       </>
                     )}
                   </div>
                 )}
               </div>
             </div>
           </div>
         </div>
       </div>
     );
   }
 
   // ========================================
   // CAMERIERE
   // ========================================
   if (role === 'cameriere') {
     const visibleMenu = menu.filter(d => !hiddenDishes.includes(d.id));
+    const orderedCategories = getOrderedCategories();
     
     return (
       <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
         <div className="max-w-6xl mx-auto">
+          {renderSectionTabs()}
           {/* Header */}
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-orange-900">🍽️ Cameriere - Ordini</h1>
             <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
               <LogOut size={18} /> Esci
             </button>
           </div>
 
           {/* Notifiche Ordini Pronti */}
           {notifications.length > 0 && (
             <div className="mb-6 space-y-2">
               {notifications.map(notif => (
                 <div 
                   key={notif.id} 
                   className={`p-4 rounded-lg shadow-lg flex justify-between items-center animate-pulse ${
                     notif.type === 'cucina' ? 'bg-red-100 border-2 border-red-500' : 'bg-cyan-100 border-2 border-cyan-500'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <span className="text-2xl">{notif.type === 'cucina' ? '👨‍🍳' : '🍹'}</span>
                     <div>
                       <p className="font-bold text-gray-800">{notif.message}</p>
                       <p className="text-sm text-gray-600">Ordine #{notif.orderId}</p>
                     </div>
                   </div>
@@ -823,69 +945,73 @@ export default function GestionaleRistorante() {
                 </p>
               </div>
             </div>
 
             {/* Sezione Ordini */}
             <div className="lg:col-span-2">
               {/* Nuovo Ordine */}
               <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                 <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-semibold text-gray-800">Nuovo Ordine T{selectedTable || '-'}</h2>
                   <button 
                     onClick={() => setShowMenu(!showMenu)} 
                     className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
                   >
                     {showMenu ? <EyeOff size={18} /> : <Eye size={18} />} {showMenu ? 'Nascondi' : 'Menu'}
                   </button>
                 </div>
 
                 {/* Menu Piatti */}
                 {showMenu && (
                   <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                     {visibleMenu.length === 0 ? (
                       <p className="text-gray-500">Nessun piatto disponibile</p>
                     ) : (
                       <div className="space-y-4">
-                        {['Antipasti', 'Primi', 'Secondi', 'Contorni', 'Dessert', 'Bevande'].map(category => {
+                        {orderedCategories.map(category => {
                           const dishesInCategory = visibleMenu.filter(d => d.category === category);
                           const categoryColors = {
+                            'Coperti': 'border-slate-500 bg-slate-50',
                             'Antipasti': 'border-purple-500 bg-purple-50',
                             'Primi': 'border-blue-500 bg-blue-50',
                             'Secondi': 'border-amber-500 bg-amber-50',
                             'Contorni': 'border-green-500 bg-green-50',
                             'Dessert': 'border-pink-500 bg-pink-50',
-                            'Bevande': 'border-cyan-500 bg-cyan-50'
+                            'Bibite': 'border-cyan-500 bg-cyan-50',
+                            'Birre': 'border-lime-500 bg-lime-50',
+                            'Vini': 'border-rose-500 bg-rose-50',
+                            'Bar': 'border-emerald-500 bg-emerald-50'
                           };
                           if (dishesInCategory.length === 0) return null;
                           return (
                             <div key={category}>
                               <h4 className="font-bold text-gray-700 text-sm mb-2">{category}</h4>
                               <div className="space-y-2">
                                 {dishesInCategory.map(dish => (
-                                  <button 
-                                    key={dish.id} 
-                                    onClick={() => addToOrder(dish)} 
+                                  <button
+                                    key={dish.id}
+                                    onClick={() => addToOrder(dish)}
                                     className={`w-full text-left p-3 rounded-lg hover:opacity-80 transition border-l-4 text-sm ${categoryColors[category]}`}
                                   >
                                     <div className="flex justify-between">
                                       <span className="font-semibold">{dish.name}</span>
                                       <span className="font-bold">€ {dish.price.toFixed(2)}</span>
                                     </div>
                                     {dish.notes && <p className="text-xs text-blue-600 mt-1">ℹ️ {dish.notes}</p>}
                                     {dish.allergens && <p className="text-xs text-red-600 mt-1">⚠️ {dish.allergens}</p>}
                                   </button>
                                 ))}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     )}
                   </div>
                 )}
 
                 {/* Articoli Ordinati */}
                 <div className="space-y-3 mb-6">
                   {currentOrderItems.length === 0 ? (
                     <p className="text-gray-500">Nessun articolo</p>
                   ) : (
                     currentOrderItems.map((item, idx) => (
@@ -1055,50 +1181,51 @@ export default function GestionaleRistorante() {
                         </div>
                       </>
                     )}
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>
     );
   }
 
   // ========================================
   // CUCINA
   // ========================================
   if (role === 'cucina') {
     // Ordina gli ordini dal più recente al meno recente
     const sortedKitchenOrders = [...kitchenOrders].sort((a, b) => {
       return b.id.localeCompare(a.id);
     });
 
     return (
       <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
         <div className="max-w-6xl mx-auto">
+          {renderSectionTabs()}
           {/* Header */}
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-red-900">👨‍🍳 Terminale Cucina</h1>
             <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
               <LogOut size={18} /> Esci
             </button>
           </div>
 
           {sortedKitchenOrders.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-lg shadow-lg">
               <p className="text-2xl text-gray-500">✨ Nessun ordine in attesa</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {sortedKitchenOrders.map(order => (
                 <div 
                   key={order.id} 
                   className={`p-6 rounded-lg shadow-lg ${
                     order.status === 'annullato' ? 'bg-gray-200 border-4 border-gray-500' :
                     order.status === 'in_attesa' ? 'bg-gray-100 border-4 border-gray-400' :
                     order.status === 'nuovo' ? 'bg-red-100 border-4 border-red-500' : 
                     order.status === 'in_preparazione' ? 'bg-yellow-100 border-4 border-yellow-500' : 
                     'bg-green-100 border-4 border-green-500'
                   }`}
                 >
@@ -1162,50 +1289,51 @@ export default function GestionaleRistorante() {
                         <div className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold text-center">✓ Pronto</div>
                       </>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </div>
     );
   }
 
   // ========================================
   // BAR
   // ========================================
   if (role === 'bar') {
     // Ordina gli ordini dal più recente al meno recente
     const sortedBarOrders = [...barOrders].sort((a, b) => {
       return b.id.localeCompare(a.id);
     });
 
     return (
       <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
         <div className="max-w-6xl mx-auto">
+          {renderSectionTabs()}
           {/* Header */}
           <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-cyan-900">🍹 Terminale Bar</h1>
             <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
               <LogOut size={18} /> Esci
             </button>
           </div>
 
           {sortedBarOrders.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-lg shadow-lg">
               <p className="text-2xl text-gray-500">✨ Nessuna bevanda in attesa</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {sortedBarOrders.map(order => (
                 <div 
                   key={order.id} 
                   className={`p-6 rounded-lg shadow-lg ${
                     order.status === 'annullato' ? 'bg-gray-200 border-4 border-gray-500' :
                     order.status === 'nuovo' ? 'bg-cyan-100 border-4 border-cyan-500' : 
                     order.status === 'in_preparazione' ? 'bg-blue-100 border-4 border-blue-500' : 
                     'bg-green-100 border-4 border-green-500'
                   }`}
                 >
                   <div className="flex justify-between items-center mb-4">
@@ -1258,58 +1386,57 @@ export default function GestionaleRistorante() {
                           onClick={() => goBackOrderStatus(order.id, false)} 
                           className="bg-gray-400 text-white py-2 px-3 rounded-lg font-semibold hover:bg-gray-500 transition text-sm"
                         >
                           ⬅️
                         </button>
                         <div className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold text-center">✓ Pronto</div>
                       </>
                     )}
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </div>
     );
   }
 
   // ========================================
   // LOGIN
   // ========================================
   return (
     <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
       <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
         <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">🍽️ Gestionale Ristorante</h1>
-        
-        <div className="space-y-4">
-          <button 
-            onClick={() => setRole('gestore')} 
-            className="w-full bg-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition"
-          >
-            📋 Gestore
-          </button>
-          <button 
-            onClick={() => setRole('cameriere')} 
-            className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-orange-600 transition"
-          >
-            🍽️ Cameriere
-          </button>
-          <button 
-            onClick={() => setRole('cucina')} 
-            className="w-full bg-red-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-600 transition"
-          >
-            👨‍🍳 Cucina
-          </button>
-          <button 
-            onClick={() => setRole('bar')} 
-            className="w-full bg-cyan-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-cyan-600 transition"
-          >
-            🍹 Bar
-          </button>
+
+        <div className="space-y-3">
+          {[{
+            key: 'completo', label: 'Accesso Completo', color: 'bg-purple-500 hover:bg-purple-600'
+          }, {
+            key: 'gestore', label: 'Gestore - Cassa', color: 'bg-blue-500 hover:bg-blue-600'
+          }, {
+            key: 'menu', label: 'Gestione Menu', color: 'bg-indigo-500 hover:bg-indigo-600'
+          }, {
+            key: 'cameriere', label: 'Cameriere', color: 'bg-orange-500 hover:bg-orange-600'
+          }, {
+            key: 'cucina', label: 'Cucina', color: 'bg-red-500 hover:bg-red-600'
+          }, {
+            key: 'bar', label: 'Bar', color: 'bg-cyan-500 hover:bg-cyan-600'
+          }, {
+            key: 'cameriereBar', label: 'Cameriere + Bar', color: 'bg-teal-500 hover:bg-teal-600'
+          }].map(option => (
+            <button
+              key={option.key}
+              onClick={() => startAccess(option.key)}
+              className={`w-full text-white py-3 rounded-lg font-bold text-lg transition ${option.color}`}
+            >
+              {accessConfigurations[option.key]?.label || option.label}
+            </button>
+          ))}
         </div>
 
         <p className="text-center text-gray-500 text-sm mt-8">Seleziona il tuo ruolo per accedere</p>
       </div>
     </div>
   );
 }
 
EOF
)
