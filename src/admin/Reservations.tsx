import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Clock, CheckCircle, XCircle, Search, Edit2, Trash2, Calendar } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export default function Reservations() {
  const { role, posList } = useAdmin();
  const { data: reservations, loading } = useFirestore('reservations', 'date');
  const [search, setSearch] = useState('');
  
  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  const filtered = reservations.filter((r: any) => 
    r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search)
  ).sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reservations', id), { status: newStatus });
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette réservation ?") && ['super_admin', 'editor', 'admin'].includes(role || '')) {
      try {
        await deleteDoc(doc(db, 'reservations', id));
      } catch (e: any) {
        alert("Erreur: " + e.message);
      }
    }
  };

  const getPosName = (id: string) => {
    return posList.find(p => p.id === id)?.name || 'Inconnu';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Réservations</h1>
          <p className="text-gray-500 font-medium">Gestion des réservations de tables.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#DA291C]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
             <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-gray-500 tracking-wider">
               <tr>
                 <th className="p-4">Détails Client</th>
                 <th className="p-4">Date & Heure</th>
                 <th className="p-4">Personnes</th>
                 <th className="p-4">Restaurant</th>
                 <th className="p-4">Statut</th>
                 <th className="p-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filtered.map((res: any) => (
                 <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="p-4">
                     <div className="font-bold text-gray-900">{res.customerName}</div>
                     <div className="text-xs text-gray-500">{res.phone}</div>
                   </td>
                   <td className="p-4">
                     <div className="font-medium text-gray-900">{new Date(res.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                     <div className="text-sm font-bold text-[#DA291C]">{res.time}</div>
                   </td>
                   <td className="p-4">
                     <span className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">{res.guests} pers.</span>
                   </td>
                   <td className="p-4">
                     <span className="font-medium text-gray-700">{getPosName(res.posId)}</span>
                   </td>
                   <td className="p-4">
                     <select 
                       value={res.status || 'pending'}
                       onChange={(e) => handleStatusChange(res.id, e.target.value)}
                       className={`text-sm font-bold px-3 py-1.5 rounded-lg border-0 pr-8 focus:ring-0 cursor-pointer ${
                         res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                         res.status === 'rejected' ? 'bg-red-100 text-red-700' :
                         res.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                         'bg-orange-100 text-orange-700'
                       }`}
                     >
                       <option value="pending">En attente</option>
                       <option value="confirmed">Confirmée</option>
                       <option value="rejected">Refusée</option>
                       <option value="completed">Terminée</option>
                     </select>
                   </td>
                   <td className="p-4 text-right">
                     {['super_admin', 'editor', 'admin'].includes(role || '') && (
                        <button onClick={() => handleDelete(res.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-200"><Trash2 className="w-4 h-4"/></button>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
              <Calendar className="w-12 h-12 mb-4 text-gray-300" />
              <p className="font-bold text-lg">Aucune réservation trouvée.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
