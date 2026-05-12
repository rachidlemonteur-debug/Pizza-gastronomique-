import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Products() {
  const { role } = useAdmin();
  const { data: products, loading } = useFirestore('products', 'name');
  const [search, setSearch] = useState('');
  
  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  const filtered = products.filter((p: any) => p.name?.toLowerCase().includes(search.toLowerCase()));

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { isAvailable: !current });
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer ce produit ?") && ['super_admin', 'editor', 'admin'].includes(role || '')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (e: any) {
        alert("Erreur: " + e.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Produits</h1>
          <p className="text-gray-500 font-medium">Catalogue global.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#DA291C]"
            />
          </div>
          {['super_admin', 'admin', 'editor'].includes(role || '') && (
            <button className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700">
              <Plus className="w-5 h-5" /> Ajouter
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden auto-cols-max">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Produit</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium">
              {filtered.map((prod: any) => (
                <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {prod.image ? (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 bg-cover bg-center" style={{backgroundImage: `url(${prod.image})`}} />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">?</div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{prod.name}</div>
                        <div className="text-gray-500 text-xs">{prod.categoryId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-900">{prod.price?.toLocaleString()} Ar</td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleAvailability(prod.id, prod.isAvailable ?? true)}
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${prod.isAvailable !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {prod.isAvailable !== false ? 'Disponible' : 'Rupture'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    {['super_admin', 'editor', 'admin'].includes(role || '') && (
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 bg-white rounded-lg border border-gray-200"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(prod.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-200"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
