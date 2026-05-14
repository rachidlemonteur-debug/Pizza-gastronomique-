import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { User, Shield, Search, Edit2, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Users() {
  const { role } = useAdmin();
  const { data: users, loading } = useFirestore('users', 'email');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  if (!['super_admin', 'admin'].includes(role || '')) {
    return <div className="p-8 text-center bg-red-50 text-red-700 font-bold rounded-2xl">Accès refusé. Réservé aux Administrateurs.</div>;
  }

  const filtered = users.filter((u: any) => 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const ROLES = [
    { id: 'customer', label: 'Client (Défaut)' },
    { id: 'viewer', label: 'Observateur' },
    { id: 'staff', label: 'Staff' },
    { id: 'manager', label: 'Manager' },
    { id: 'admin', label: 'Administrateur' },
    { id: 'super_admin', label: 'Super Admin' }
  ];

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (window.confirm(`Confirmer le changement de rôle ?`)) {
      setUpdating(userId);
      try {
        await updateDoc(doc(db, 'users', userId), { role: newRole });
      } catch (err: any) {
        alert("Erreur: " + err.message);
      } finally {
        setUpdating(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Utilisateurs & Rôles</h1>
          <p className="text-gray-500 font-medium">Gérez les accès et permissions de l'espace d'administration.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher par email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#DA291C]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
             <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-gray-500 tracking-wider">
               <tr>
                 <th className="p-4">Utilisateur</th>
                 <th className="p-4">Rôle actuel</th>
                 <th className="p-4 text-right">Modifier le Rôle</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filtered.map((user: any) => (
                 <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="p-4">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                         <User className="w-5 h-5"/>
                       </div>
                       <div>
                         <div className="font-bold text-gray-900">{user.email || 'Email non défini'}</div>
                         <div className="text-xs text-gray-500">ID: {user.id}</div>
                       </div>
                     </div>
                   </td>
                   <td className="p-4">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                       user.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                       user.role === 'admin' ? 'bg-orange-100 text-orange-700' :
                       user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                       user.role === 'staff' ? 'bg-purple-100 text-purple-700' :
                       user.role === 'viewer' ? 'bg-gray-100 text-gray-700' :
                       'bg-green-100 text-green-700'
                     }`}>
                       {user.role || 'Client'}
                     </span>
                   </td>
                   <td className="p-4 text-right">
                     <div className="flex items-center justify-end gap-2 relative">
                        <select 
                          value={user.role || 'customer'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updating === user.id || user.email === 'beidoufadimatou1998@gmail.com' || (user.role === 'super_admin' && role !== 'super_admin')}
                          className="bg-white border border-gray-200 text-sm font-bold rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#DA291C]"
                        >
                          {ROLES.map(r => (
                            <option key={r.id} value={r.id} disabled={r.id === 'super_admin' && role !== 'super_admin'}>{r.label}</option>
                          ))}
                        </select>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-bold">Aucun utilisateur trouvé.</div>
          )}
        </div>
      </div>
    </div>
  );
}
