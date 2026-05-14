import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Search, Star, MessageSquare, Trash2, CheckCircle } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Reviews() {
  const { role } = useAdmin();
  const { data: reviews, loading } = useFirestore('reviews', 'createdAt');
  const [search, setSearch] = useState('');

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  const filtered = reviews.filter((r: any) => 
    r.comment?.toLowerCase().includes(search.toLowerCase())
  ).sort((a:any, b:any) => b.createdAt - a.createdAt);

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cet avis ?") && ['super_admin', 'editor', 'admin'].includes(role || '')) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
      } catch (e: any) {
        alert("Erreur: " + e.message);
      }
    }
  };

  const handleToggleVisible = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'reviews', id), { isPublic: !current });
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Avis Clients</h1>
          <p className="text-gray-500 font-medium">Modération des avis sur la plateforme.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher..."
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
                 <th className="p-4">Note</th>
                 <th className="p-4">Avis</th>
                 <th className="p-4">Affichage</th>
                 <th className="p-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filtered.map((r: any) => (
                 <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="p-4">
                     <span className="font-bold text-gray-900 block">
                       {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                     </span>
                     <span className="text-gray-500 text-xs">
                       {new Date(r.createdAt).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}
                     </span>
                   </td>
                   <td className="p-4">
                     <div className="flex items-center gap-1 text-[#FFC72C]">
                       {[...Array(5)].map((_, i) => (
                         <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'text-gray-300'}`} />
                       ))}
                     </div>
                   </td>
                   <td className="p-4">
                     <p className="text-sm text-gray-700 max-w-sm">{r.comment || <span className="italic text-gray-400">Aucun commentaire</span>}</p>
                     {r.appFeatures?.length > 0 && (
                       <div className="flex flex-wrap gap-1 mt-2">
                         {r.appFeatures.map((f: string, i: number) => (
                           <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-bold">{f}</span>
                         ))}
                       </div>
                     )}
                   </td>
                   <td className="p-4">
                     <button
                       onClick={() => handleToggleVisible(r.id, !!r.isPublic)}
                       className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                         r.isPublic ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                       }`}
                     >
                       {r.isPublic ? <><CheckCircle className="w-3 h-3"/> Public</> : 'Masqué'}
                     </button>
                   </td>
                   <td className="p-4 text-right">
                     {['super_admin', 'editor', 'admin'].includes(role || '') && (
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-200"><Trash2 className="w-4 h-4"/></button>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
              <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
              <p className="font-bold text-lg">Aucun avis reçu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
