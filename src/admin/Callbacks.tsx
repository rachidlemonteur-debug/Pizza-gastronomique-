import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Search, Phone, CheckCircle, Clock } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Callbacks() {
  const { role } = useAdmin();
  const { data: callbacks, loading } = useFirestore('callbacks', 'createdAt');
  const [search, setSearch] = useState('');

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  const filtered = callbacks.filter((c: any) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  ).sort((a:any, b:any) => b.createdAt - a.createdAt);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'callbacks', id), { status: newStatus });
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Rappels Commerciaux</h1>
          <p className="text-gray-500 font-medium">Demandes des clients souhaitant être rappelés.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher (Nom ou Tel)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#DA291C]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
             <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-gray-500 tracking-wider">
               <tr>
                 <th className="p-4">Date</th>
                 <th className="p-4">Client</th>
                 <th className="p-4">Message Contextuel</th>
                 <th className="p-4">Statut</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filtered.map((cb: any) => (
                 <tr key={cb.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="p-4">
                     <span className="font-bold text-gray-900">
                       {new Date(cb.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                     </span>
                     <span className="text-gray-500 text-xs block">
                       {new Date(cb.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                     </span>
                   </td>
                   <td className="p-4">
                     <div className="font-bold text-gray-900">{cb.name}</div>
                     <div className="text-sm font-mono text-[#DA291C] flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {cb.phone}
                     </div>
                   </td>
                   <td className="p-4">
                     <p className="text-sm text-gray-600 max-w-sm truncate">{cb.message || <span className="text-gray-400 italic">Aucun message</span>}</p>
                   </td>
                   <td className="p-4">
                     {['super_admin', 'admin', 'manager', 'editor', 'staff'].includes(role || '') ? (
                       <select 
                         value={cb.status || 'pending'}
                         onChange={(e) => handleStatusChange(cb.id, e.target.value)}
                         className={`text-sm font-bold px-3 py-1.5 rounded-lg border-0 pr-8 focus:ring-0 cursor-pointer ${
                           cb.status === 'completed' ? 'bg-green-100 text-green-700' :
                           'bg-orange-100 text-orange-700'
                         }`}
                       >
                         <option value="pending">En attente / À rappeler</option>
                         <option value="completed">Traité / Rappelé</option>
                       </select>
                     ) : (
                       cb.status === 'completed' ? 
                         <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg">Fait</span> :
                         <span className="bg-orange-100 text-orange-700 text-sm font-bold px-3 py-1.5 rounded-lg">À faire</span>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
              <Phone className="w-12 h-12 mb-4 text-gray-300" />
              <p className="font-bold text-lg">Aucun rappel trouvé.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
