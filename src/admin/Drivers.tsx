import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Bike, Search, Plus, MapPin } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Drivers() {
  const { selectedPosId, posList } = useAdmin();
  const { data: drivers, loading } = useFirestore('drivers', 'createdAt');
  const [search, setSearch] = useState('');

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  let filtered = selectedPosId === 'ALL' ? drivers : drivers.filter((d: any) => d.posId === selectedPosId);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((d: any) => d.name?.toLowerCase().includes(s) || d.phone?.includes(s));
  }

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'available' ? 'offline' : 'available';
    try {
      await updateDoc(doc(db, 'drivers', id), { status: newStatus });
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const getPosName = (id: string) => {
    return posList.find(p => p.id === id)?.name || 'Inconnu';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Livreurs</h1>
          <p className="text-gray-500 font-medium">Gestion de la flotte.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Nom, téléphone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#DA291C]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((driver: any) => (
          <div key={driver.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative overflow-hidden">
             {/* Status indicator line */}
             <div className={`absolute top-0 left-0 w-full h-1 ${driver.status === 'available' ? 'bg-green-500' : driver.status === 'delivering' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
             
             <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                   <Bike className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="font-black text-gray-900 text-lg leading-tight">{driver.name}</h3>
                   <p className="text-gray-500 text-sm font-medium leading-tight">{driver.phone}</p>
                 </div>
               </div>
             </div>
             
             <div className="space-y-2 mb-6">
               <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                 <MapPin className="w-4 h-4 text-[#DA291C]"/> Zone : {getPosName(driver.posId)}
               </div>
               <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                 <div className={`w-2 h-2 rounded-full ${driver.status === 'available' ? 'bg-green-500' : driver.status === 'delivering' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                 Statut : <span className="uppercase font-bold text-gray-800">{driver.status || 'offline'}</span>
               </div>
             </div>
             
             <button 
               onClick={() => toggleStatus(driver.id, driver.status)}
               className={`mt-auto w-full py-2 rounded-lg font-bold text-sm transition-colors ${driver.status === 'available' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
             >
               {driver.status === 'available' ? 'Passer Hors Ligne' : 'Passer En Ligne'}
             </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
            Aucun livreur.
          </div>
        )}
      </div>
    </div>
  );
}
