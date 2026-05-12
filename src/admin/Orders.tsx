import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Search, MapPin, Phone, Bike, Check } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Orders() {
  const { selectedPosId } = useAdmin();
  const { data: orders, loading } = useFirestore('orders', 'timestamp', undefined, 100); // Last 100 orders
  const { data: drivers } = useFirestore('drivers');
  
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [search, setSearch] = useState('');

  if (loading) {
    return <div className="text-gray-500 font-bold">Chargement des commandes...</div>;
  }

  // Filter logic
  let filtered = selectedPosId === 'ALL' ? orders : orders.filter((o: any) => o.posId === selectedPosId);
  
  if (filterStatus === 'active') {
    filtered = filtered.filter((o: any) => !['completed', 'cancelled'].includes(o.status));
  } else if (filterStatus !== 'all') {
    filtered = filtered.filter((o: any) => o.status === filterStatus);
  }

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((o: any) => 
      o.orderNumber?.toString().includes(s) || 
      o.customerName?.toLowerCase().includes(s) ||
      o.phone?.includes(s)
    );
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    const driver = drivers.find((d: any) => d.id === driverId);
    if (!driver) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        driver: { id: driver.id, name: driver.name, phone: driver.phone },
        status: 'assigned' 
      });
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-800',
    cooking: 'bg-orange-100 text-orange-800',
    assigned: 'bg-blue-100 text-blue-800',
    delivering: 'bg-purple-100 text-purple-800',
    arrived: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const availableDrivers = selectedPosId === 'ALL' ? drivers : drivers.filter((d: any) => d.posId === selectedPosId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Commandes</h1>
          <p className="text-gray-500 font-medium">Gérez le flux de commandes.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="N° Commande, Nom..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#DA291C]/20 focus:border-[#DA291C]"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold focus:outline-none"
          >
            <option value="active">En cours</option>
            <option value="all">Toutes</option>
            <option value="pending">En attente</option>
            <option value="completed">Terminées</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-500 font-medium">
            Aucune commande trouvée.
          </div>
        ) : filtered.map((order: any) => (
          <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-2">
                 <h3 className="font-black text-lg text-gray-900">#{order.orderNumber}</h3>
                 <span className={`px-2 py-1 select-none rounded text-xs font-bold uppercase ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                   {order.status}
                 </span>
                 <span className="text-sm font-bold text-gray-500">• {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                 <div>
                   <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Client</p>
                   <p className="font-bold text-gray-900">{order.customerName || 'Anonyme'}</p>
                   <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><Phone className="w-4 h-4"/> {order.phone}</p>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Livraison</p>
                   <p className="text-sm text-gray-900 flex items-start gap-1"><MapPin className="w-4 h-4 mt-0.5 shrink-0"/> <span className="line-clamp-2">{order.address}</span></p>
                   {selectedPosId === 'ALL' && <p className="text-xs font-bold text-[#DA291C] mt-1">POS: {order.posName}</p>}
                 </div>
               </div>
               
            </div>
            
            <div className="flex flex-col gap-2 md:w-64 shrink-0 bg-gray-50 p-4 rounded-xl border border-gray-100">
               <div>
                 <p className="text-sm font-bold text-gray-500 mb-1">Livreur</p>
                 {['pending', 'cooking'].includes(order.status) ? (
                   <select 
                     className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:outline-none"
                     onChange={e => e.target.value && assignDriver(order.id, e.target.value)}
                     value={order.driver?.id || ''}
                   >
                     <option value="">-- Assigner --</option>
                     {availableDrivers.map((d: any) => (
                       <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                     ))}
                   </select>
                 ) : (
                   <div className="flex items-center gap-2 text-sm font-bold">
                     <Bike className="w-4 h-4 text-[#DA291C]" />
                     {order.driver?.name || 'Inconnu'}
                   </div>
                 )}
               </div>
               
               <div className="mt-2">
                 <p className="text-sm font-bold text-gray-500 mb-1">Action rapide</p>
                 <select
                   value={order.status}
                   onChange={e => updateStatus(order.id, e.target.value)}
                   className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold focus:outline-none"
                 >
                   <option value="pending">En attente</option>
                   <option value="cooking">En préparation</option>
                   <option value="assigned">Assigné</option>
                   <option value="delivering">En livraison</option>
                   <option value="arrived">Arrivé</option>
                   <option value="completed">Terminée</option>
                   <option value="cancelled">Annulée</option>
                 </select>
               </div>
               
               <div className="mt-auto pt-4 border-t border-gray-200">
                  <p className="font-black text-xl text-right text-gray-900">{order.total?.toLocaleString()} Ar</p>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
