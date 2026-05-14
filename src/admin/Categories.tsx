import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Search, Plus, Edit2, Trash2, X, List as ListIcon } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export default function Categories() {
  const { role } = useAdmin();
  const { data: categories, loading } = useFirestore('categories', 'order');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    order: 0
  });

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  const filtered = categories.filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette catégorie ? Attention, vérifiez que plus aucun produit n'y est lié.") && ['super_admin', 'editor', 'admin'].includes(role || '')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (e: any) {
        alert("Erreur: " + e.message);
      }
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', order: categories.length + 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      order: cat.order || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        order: Number(formData.order)
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), payload);
      } else {
        await addDoc(collection(db, 'categories'), payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Catégories</h1>
          <p className="text-gray-500 font-medium">Gérez le menu et l'organisation des produits.</p>
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
          {['super_admin', 'admin', 'editor'].includes(role || '') && (
            <button onClick={openAddModal} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700">
              <Plus className="w-5 h-5" /> Ajouter
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
             <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-gray-500 tracking-wider">
               <tr>
                 <th className="p-4 w-20">Ordre</th>
                 <th className="p-4">Nom de la Catégorie</th>
                 <th className="p-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filtered.map((cat: any) => (
                 <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="p-4">
                     <span className="font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{cat.order}</span>
                   </td>
                   <td className="p-4">
                     <div className="font-bold text-gray-900">{cat.name}</div>
                   </td>
                   <td className="p-4 text-right">
                     {['super_admin', 'editor', 'admin'].includes(role || '') && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(cat)} className="p-2 text-gray-400 hover:text-blue-600 bg-white rounded-lg border border-gray-200"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-200"><Trash2 className="w-4 h-4"/></button>
                        </div>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
              <ListIcon className="w-12 h-12 mb-4 text-gray-300" />
              <p className="font-bold text-lg">Aucune catégorie trouvée.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-xl">{editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-2 shadow-sm">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ordre d'affichage</label>
                <input required type="number" value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Annuler</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-[#DA291C] text-white font-bold rounded-xl hover:bg-red-700 shadow-md">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
