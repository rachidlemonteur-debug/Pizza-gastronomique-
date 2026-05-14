import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export default function Products() {
  const { role } = useAdmin();
  const { data: products, loading } = useFirestore('products', 'name');
  const { data: categories } = useFirestore('categories', 'order');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    categoryId: '',
    isAvailable: true
  });

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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', image: '', categoryId: categories[0]?.id || '', isAvailable: true });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: any) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price?.toString() || '',
      image: prod.image || '',
      categoryId: prod.categoryId || '',
      isAvailable: prod.isAvailable ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price)
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), payload);
      } else {
        await addDoc(collection(db, 'products'), payload);
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
            <button onClick={openAddModal} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700">
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
                        <div className="text-gray-500 text-xs">{categories.find((c:any) => c.id === prod.categoryId)?.name || prod.categoryId}</div>
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
                        <button onClick={() => openEditModal(prod)} className="p-2 text-gray-400 hover:text-blue-600 bg-white rounded-lg border border-gray-200"><Edit2 className="w-4 h-4"/></button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-xl">{editingProduct ? 'Modifier le produit' : 'Nouveau produit'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-2 shadow-sm">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom du produit</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Prix (Ar)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                  <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all">
                    <option value="">Sélectionner</option>
                    {categories.map((c:any) => (
                       <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all resize-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL de l'image</label>
                <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-100 bg-gray-50 rounded-xl">
                <input type="checkbox" checked={formData.isAvailable} onChange={e => setFormData({...formData, isAvailable: e.target.checked})} className="w-5 h-5 accent-[#DA291C]"/>
                <span className="font-bold text-gray-700">Produit disponible à la vente</span>
              </label>

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
