import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Check, Clock, LogOut, Eye, EyeOff, DollarSign } from 'lucide-react';
import { useDatabase } from './useDatabase';
import { playSound } from './sounds';

export default function GestionaleRistorante() {
  const { menu: dbMenu, kitchenOrders: dbKitchenOrders, barOrders: dbBarOrders, loading, saveData } = useDatabase();
  const [role, setRole] = useState(null);
  const [menu, setMenu] = useState([]);
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [barOrders, setBarOrders] = useState([]);
  const [tables, setTables] = useState(Array.from({length: 12}, (_, i) => ({ id: i+1, status: 'libero' })));
  const [hiddenDishes, setHiddenDishes] = useState([]);
  
  const [newDish, setNewDish] = useState({ name: '', price: '', category: 'Antipasti', notes: '', allergens: '' });
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrderItems, setCurrentOrderItems] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedTableForPayment, setSelectedTableForPayment] = useState(null);

  const prevKitchenCount = useRef(0);
  const prevBarCount = useRef(0);

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
    if (role === 'cucina' && kitchenOrders.length > prevKitchenCount.current) {
      const newOrdersCount = kitchenOrders.length - prevKitchenCount.current;
      if (newOrdersCount > 0) {
        playSound('newOrder');
      }
    }
    prevKitchenCount.current = kitchenOrders.length;
  }, [kitchenOrders, role]);

  useEffect(() => {
    if (role === 'bar' && barOrders.length > prevBarCount.current) {
      const newOrdersCount = barOrders.length - prevBarCount.current;
      if (newOrdersCount > 0) {
        playSound('newOrder');
      }
    }
    prevBarCount.current = barOrders.length;
  }, [barOrders, role]);

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
      await saveData(newMenu, kitchenOrders, barOrders);
      setNewDish({ name: '', price: '', category: 'Antipasti', notes: '', allergens: '' });
    }
  };

  const removeDish = async (id) => {
    const newMenu = menu.filter(d => d.id !== id);
    setMenu(newMenu);
    await saveData(newMenu, kitchenOrders, barOrders);
  };

  const toggleHideDish = (id) => {
    setHiddenDishes(prev => 
      prev.includes(id) ? prev.filter(hd => hd !== id) : [...prev, id]
    );
  };

  const addToOrder = (dish) => {
    const existing = currentOrderItems.find(item => item.dishId === dish.id);
    if (existing) {
      setCurrentOrderItems(currentOrderItems.map(item =>
        item.dishId === dish.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCurrentOrderItems([...currentOrderItems, { dishId: dish.id, name: dish.name, price: dish.price, qty: 1, notes: '' }]);
    }
  };

  const saveOrder = async () => {
    if (selectedTable && currentOrderItems.length > 0) {
      const newOrder = {
        id: Date.now().toString(),
        tableId: selectedTable,
        items: currentOrderItems,
        status: 'nuovo',
        timestamp: new Date().toLocaleTimeString('it-IT'),
        total: currentOrderItems.reduce((sum, item) => sum + item.price * item.qty, 0),
        paid: false
      };

      const kitchenItems = currentOrderItems.filter(item => {
        const dish = menu.find(d => d.id === item.dishId);
        return dish && dish.category !== 'Bevande';
      });
      
      const barItems = currentOrderItems.filter(item => {
        const dish = menu.find(d => d.id === item.dishId);
        return dish && dish.category === 'Bevande';
      });

      let newKitchenOrders = kitchenOrders;
      let newBarOrders = barOrders;

      if (kitchenItems.length > 0) {
        const kitchenOrder = { ...newOrder, items: kitchenItems };
        newKitchenOrders = [...kitchenOrders, kitchenOrder];
      }

      if (barItems.length > 0) {
        const barOrder = { ...newOrder, items: barItems };
        newBarOrders = [...barOrders, barOrder];
      }

      setKitchenOrders(newKitchenOrders);
      setBarOrders(newBarOrders);
      await saveData(menu, newKitchenOrders, newBarOrders);
      setCurrentOrderItems([]);
      setSelectedTable(null);
      setShowMenu(false);
    }
  };

  const updateKitchenOrderStatus = async (orderId, newStatus) => {
    const newKitchenOrders = kitchenOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setKitchenOrders(newKitchenOrders);
    await saveData(menu, newKitchenOrders, barOrders);
  };

  const updateBarOrderStatus = async (orderId, newStatus) => {
    const newBarOrders = barOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setBarOrders(newBarOrders);
    await saveData(menu, kitchenOrders, newBarOrders);
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

  const markAsPaid = async (orderId) => {
    const newKitchenOrders = kitchenOrders.filter(o => o.id !== orderId);
    const newBarOrders = barOrders.filter(o => o.id !== orderId);
    setKitchenOrders(newKitchenOrders);
    setBarOrders(newBarOrders);
    await saveData(menu, newKitchenOrders, newBarOrders);
  };

  const getTableAllOrders = (tableId) => {
    return [...kitchenOrders, ...barOrders].filter(o => o.tableId === tableId);
  };

  const logout = () => {
    setRole(null);
    setSelectedTable(null);
    setCurrentOrderItems([]);
    setShowMenu(false);
    setSelectedTableForPayment(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-2xl">Caricamento...</p></div>;
  }

  // ===== GESTORE =====
  if (role === 'gestore') {
    const tableAllOrders = selectedTableForPayment ? getTableAllOrders(selectedTableForPayment) : [];
    const totalAmount = tableAllOrders.reduce((sum, order) => sum + order.total, 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-900">📋 Gestore - Cassa</h1>
            <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
              <LogOut size={18} /> Esci
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Aggiungi Piatto</h2>
                <div className="space-y-3">
                  <input type="text" placeholder="Nome piatto" value={newDish.name} onChange={(e) => setNewDish({...newDish, name: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <input type="number" placeholder="Prezzo (€)" value={newDish.price} onChange={(e) => setNewDish({...newDish, price: e.target.value})} step="0.10" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <select value={newDish.category} onChange={(e) => setNewDish({...newDish, category: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option>Antipasti</option>
                    <option>Primi</option>
                    <option>Secondi</option>
                    <option>Dessert</option>
                    <option>Bevande</option>
                  </select>
                  <input type="text" placeholder="Note (es. senza glutine)" value={newDish.notes} onChange={(e) => setNewDish({...newDish, notes: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <input type="text" placeholder="Allergeni (es. arachidi)" value={newDish.allergens} onChange={(e) => setNewDish({...newDish, allergens: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <button onClick={addDish} className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2">
                    <Plus size={20} /> Aggiungi
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 max-h-96 overflow-y-auto">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Menu ({menu.length})</h2>
                {menu.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nessun piatto</p>
                ) : (
                  <div className="space-y-4">
                    {['Antipasti', 'Primi', 'Secondi', 'Dessert', 'Bevande'].map(cat => {
                      const items = menu.filter(d => d.category === cat);
                      if (items.length === 0) return null;
                      return (
                        <div key={cat}>
                          <h3 className="font-bold text-gray-700 text-sm mb-2 border-b-2 pb-1">{cat}</h3>
                          {items.map(dish => (
                            <div key={dish.id} className={`p-2 mb-2 rounded ${hiddenDishes.includes(dish.id) ? 'bg-gray-200 opacity-50' : 'bg-gray-50'}`}>
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <p className={`font-semibold text-sm ${hiddenDishes.includes(dish.id) ? 'line-through text-gray-500' : 'text-gray-800'}`}>{dish.name}</p>
                                  <p className="text-green-600 font-bold text-sm">€{dish.price.toFixed(2)}</p>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => toggleHideDish(dish.id)} className={`px-2 py-1 text-xs rounded font-bold ${hiddenDishes.includes(dish.id) ? 'bg-yellow-500 text-white' : 'bg-gray-400 text-white'}`}>
                                    {hiddenDishes.includes(dish.id) ? '👁️' : '🚫'}
                                  </button>
                                  <button onClick={() => removeDish(dish.id)} className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tavoli - Gestione Pagamenti</h2>
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
                  })}
                </div>

                {selectedTableForPayment && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Ordini Tavolo {selectedTableForPayment}</h3>
                    
                    {tableAllOrders.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nessun ordine in sospeso</p>
                    ) : (
                      <div className="space-y-4">
                        {tableAllOrders.map(order => (
                          <div key={order.id} className={`border-l-4 p-4 rounded-lg ${
                            order.status === 'nuovo' ? 'bg-red-50 border-red-500' :
                            order.status === 'in_preparazione' ? 'bg-yellow-50 border-yellow-500' :
                            'bg-green-50 border-green-500'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-gray-600">{order.timestamp}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                order.status === 'nuovo' ? 'bg-red-200 text-red-800' :
                                order.status === 'in_preparazione' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-green-200 text-green-800'
                              }`}>
                                {order.status === 'nuovo' ? 'Nuovo' : order.status === 'in_preparazione' ? 'In Preparazione' : 'Pronto'}
                              </span>
                            </div>
                            
                            <div className="bg-white p-3 rounded mb-3">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm mb-1">
                                  <span>{item.qty}x {item.name}</span>
                                  <span className="font-semibold">€ {(item.price * item.qty).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xl font-semibold">Totale Tavolo:</span>
                            <span className="text-3xl font-bold">€ {totalAmount.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => markAsPaid(tableAllOrders[0].id)}
                            className="w-full bg-green-500 text-white py-4 rounded-lg font-bold hover:bg-green-600 transition flex items-center justify-center gap-2 text-lg"
                          >
                            <DollarSign size={24} /> Segna come Pagato
                          </button>
                        </div>
                      </div>
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

  // ===== CAMERIERE =====
  if (role === 'cameriere') {
    const visibleMenu = menu.filter(d => !hiddenDishes.includes(d.id));
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-orange-900">🍽️ Cameriere - Ordini</h1>
            <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
              <LogOut size={18} /> Esci
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tavoli</h2>
                <div className="grid grid-cols-3 gap-2">
                  {tables.map(table => (
                    <button key={table.id} onClick={() => setSelectedTable(table.id)} className={`p-3 rounded-lg font-bold text-sm transition ${selectedTable === table.id ? 'bg-blue-500 text-white' : getTableAllOrders(table.id).length > 0 ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
                      T{table.id}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-4">Selezionato: {selectedTable ? `T${selectedTable}` : 'Nessuno'}</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Nuovo Ordine T{selectedTable || '-'}</h2>
                  <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm">
                    {showMenu ? <EyeOff size={18} /> : <Eye size={18} />} {showMenu ? 'Nascondi' : 'Menu'}
                  </button>
                </div>

                {showMenu && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                    {visibleMenu.length === 0 ? <p className="text-gray-500">Nessun piatto disponibile</p> : (
                      <div className="space-y-4">
                        {['Antipasti', 'Primi', 'Secondi', 'Dessert', 'Bevande'].map(category => {
                          const dishesInCategory = visibleMenu.filter(d => d.category === category);
                          const categoryColors = {
                            'Antipasti': 'border-purple-500 bg-purple-50',
                            'Primi': 'border-blue-500 bg-blue-50',
                            'Secondi': 'border-amber-500 bg-amber-50',
                            'Dessert': 'border-pink-500 bg-pink-50',
                            'Bevande': 'border-cyan-500 bg-cyan-50'
                          };
                          if (dishesInCategory.length === 0) return null;
                          return (
                            <div key={category}>
                              <h4 className="font-bold text-gray-700 text-sm mb-2">{category}</h4>
                              <div className="space-y-2">
                                {dishesInCategory.map(dish => (
                                  <button key={dish.id} onClick={() => addToOrder(dish)} className={`w-full text-left p-3 rounded-lg hover:opacity-80 transition border-l-4 text-sm ${categoryColors[category]}`}>
                                    <div className="flex justify-between">
                                      <span className="font-semibold">{dish.name}</span>
                                      <span className="font-bold">€ {dish.price.toFixed(2)}</span>
                                    </div>
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

                <div className="space-y-3 mb-6">
                  {currentOrderItems.length === 0 ? <p className="text-gray-500">Nessun articolo</p> : (
                    currentOrderItems.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                            <p className="text-sm text-green-600">€ {(item.price * item.qty).toFixed(2)}</p>
                          </div>
                          <button onClick={() => removeFromOrder(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <button onClick={() => updateQuantity(idx, item.qty - 1)} className="px-2 py-1 bg-gray-300 rounded text-sm">-</button>
                          <input type="number" value={item.qty} onChange={(e) => updateQuantity(idx, parseInt(e.target.value))} className="w-12 p-1 border rounded text-center text-sm" />
                          <button onClick={() => updateQuantity(idx, item.qty + 1)} className="px-2 py-1 bg-gray-300 rounded text-sm">+</button>
                        </div>
                        <input type="text" placeholder="Note (es. senza cipolla)" value={item.notes} onChange={(e) => updateNotes(idx, e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))
                  )}
                </div>

                {currentOrderItems.length > 0 && (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">Totale:</span>
                        <span className="text-2xl font-bold text-green-600">€ {currentOrderItems.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <button onClick={saveOrder} disabled={!selectedTable} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:bg-gray-400">
                      ✓ Salva Ordine
                    </button>
                  </>
                )}
              </div>

              {selectedTable && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Storico Ordini - Tavolo {selectedTable}</h3>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getTableAllOrders(selectedTable).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nessun ordine in sospeso</p>
                    ) : (
                      <>
                        {getTableAllOrders(selectedTable).map(order => (
                          <div key={order.id} className={`border-l-4 p-3 rounded-lg text-sm ${
                            order.status === 'nuovo' ? 'bg-red-50 border-red-500' :
                            order.status === 'in_preparazione' ? 'bg-yellow-50 border-yellow-500' :
                            'bg-green-50 border-green-500'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs text-gray-600">{order.timestamp}</span>
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                order.status === 'nuovo' ? 'bg-red-200 text-red-800' :
                                order.status === 'in_preparazione' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-green-200 text-green-800'
                              }`}>
                                {order.status === 'nuovo' ? '🆕 Nuovo' : order.status === 'in_preparazione' ? '⏳ In Prep' : '✓ Pronto'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span>{item.qty}x {item.name}</span>
                                  <span className="font-semibold">€ {(item.price * item.qty).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg mt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Totale Tavolo:</span>
                            <span className="text-2xl font-bold">€ {getTableAllOrders(selectedTable).reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0), 0).toFixed(2)}</span>
                          </div>
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

  // ===== CUCINA =====
  if (role === 'cucina') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-red-900">👨‍🍳 Terminale Cucina</h1>
            <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
              <LogOut size={18} /> Esci
            </button>
          </div>

          {kitchenOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-lg">
              <p className="text-2xl text-gray-500">✨ Nessun ordine in attesa</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kitchenOrders.map(order => (
                <div key={order.id} className={`p-6 rounded-lg shadow-lg ${order.status === 'nuovo' ? 'bg-red-100 border-4 border-red-500' : order.status === 'in_preparazione' ? 'bg-yellow-100 border-4 border-yellow-500' : 'bg-green-100 border-4 border-green-500'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Tavolo {order.tableId}</h3>
                    <span className="text-xs text-gray-600">{order.timestamp}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded">
                        <p className="font-semibold text-gray-800 text-sm">{item.qty}x {item.name}</p>
                        {item.notes && <p className="text-xs text-red-600 font-semibold">📝 {item.notes}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'nuovo' && (
                      <button onClick={() => updateKitchenOrderStatus(order.id, 'in_preparazione')} className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition flex items-center justify-center gap-2">
                        <Clock size={18} /> In Prep
                      </button>
                    )}
                    {order.status === 'in_preparazione' && (
                      <button onClick={() => updateKitchenOrderStatus(order.id, 'pronto')} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2">
                        <Check size={18} /> Pronto!
                      </button>
                    )}
                    {order.status === 'pronto' && (
                      <div className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold text-center">✓ Pronto</div>
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

  // ===== BAR =====
  if (role === 'bar') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-cyan-900">🍹 Terminale Bar</h1>
            <button onClick={logout} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
              <LogOut size={18} /> Esci
            </button>
          </div>

          {barOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-lg">
              <p className="text-2xl text-gray-500">✨ Nessuna bevanda in attesa</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {barOrders.map(order => (
                <div key={order.id} className={`p-6 rounded-lg shadow-lg ${order.status === 'nuovo' ? 'bg-cyan-100 border-4 border-cyan-500' : order.status === 'in_preparazione' ? 'bg-blue-100 border-4 border-blue-500' : 'bg-green-100 border-4 border-green-500'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">Tavolo {order.tableId}</h3>
                    <span className="text-xs text-gray-600">{order.timestamp}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded">
                        <p className="font-semibold text-gray-800 text-sm">{item.qty}x {item.name}</p>
                        {item.notes && <p className="text-xs text-red-600 font-semibold">📝 {item.notes}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'nuovo' && (
                      <button onClick={() => updateBarOrderStatus(order.id, 'in_preparazione')} className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2">
                        <Clock size={18} /> In Prep
                      </button>
                    )}
                    {order.status === 'in_preparazione' && (
                      <button onClick={() => updateBarOrderStatus(order.id, 'pronto')} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2">
                        <Check size={18} /> Pronto!
                      </button>
                    )}
                    {order.status === 'pronto' && (
                      <div className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold text-center">✓ Pronto</div>
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

  // ===== LOGIN =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">🍽️ Gestionale Ristorante</h1>
        
        <div className="space-y-4">
          <button onClick={() => setRole('gestore')} className="w-full bg-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition">
            📋 Gestore
          </button>
          <button onClick={() => setRole('cameriere')} className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-orange-600 transition">
            🍽️ Cameriere
          </button>
          <button onClick={() => setRole('cucina')} className="w-full bg-red-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-600 transition">
            👨‍🍳 Cucina
          </button>
          <button onClick={() => setRole('bar')} className="w-full bg-cyan-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-cyan-600 transition">
            🍹 Bar
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">Seleziona il tuo ruolo per accedere</p>
      </div>
    </div>
  );
}
            
