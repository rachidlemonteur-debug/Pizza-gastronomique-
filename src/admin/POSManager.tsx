import React from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';

export default function POSManager() {
  const { role } = useAdmin();
  const { data: posList, loading } = useFirestore('points_of_sale', 'name');

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  if (!['super_admin', 'admin'].includes(role || '')) {
    return <div className="p-8 text-center bg-red-50 text-red-700 font-bold rounded-2xl">Accès refusé. Réservé aux administrateurs.</div>;
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Points de Vente</h1>
          <p className="text-gray-500 font-medium">Gérez la liste de vos restaurants.</p>
       </div>
       
       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-gray-500 tracking-wider">
               <tr>
                 <th className="p-4">Nom & Quartier</th>
                 <th className="p-4">Téléphone</th>
                 <th className="p-4">Horaires</th>
                 <th className="p-4">Statut</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {posList.map((pos: any) => (
                 <tr key={pos.id} className="hover:bg-gray-50 transition-colors">
                   <td className="p-4">
                     <div className="font-bold text-gray-900">{pos.name}</div>
                     <div className="text-sm text-gray-500">{pos.district || pos.address}</div>
                   </td>
                   <td className="p-4 font-medium text-gray-600">{pos.phone}</td>
                   <td className="p-4 text-sm text-gray-600 font-mono">
                     {pos.hours?.open} - {pos.hours?.close}
                   </td>
                   <td className="p-4">
                      {pos.isOpen ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Ouvert</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Fermé</span>
                      )}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
       </div>
    </div>
  );
}
