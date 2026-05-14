import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Search, Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export default function Promos() {
  const { role } = useAdmin();
  const { data: promos, loading } = useFirestore('promos', 'createdAt');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    discount: '',
    code: '',
    isActive: true
  });

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  const filtered = promos.filter((p: any) => p.title?.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette promotion ?") && ['super_admin', 'editor', 'admin'].includes(role || '')) {
      try {
        await deleteDoc(doc(db, 'promos', id));
      } catch (e: any) {
        alert("Erreur: " + e.message);
      }
    }
  };

  const openAddModal = () => {
    setEditingPromo(null);
    setFormData({ title: '', description: '', image: '', discount: '', code: '', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (promo: any) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title || '',
      description: promo.description || '',
      image: promo.image || '',
      discount: promo.discount || '',
      code: promo.code || '',
      isActive: promo.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        createdAt: editingPromo ? editingPromo.createdAt : Date.now()
      };

      if (editingPromo) {
        await updateDoc(doc(db, 'promos', editingPromo.id), payload);
      } else {
        await addDoc(collection(db, 'promos'), payload);
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
          <h1 className="text-2xl font-black text-gray-900 mb-1">Promotions</h1>
          <p className="text-gray-500 font-medium">Bannières d'offres du moment sur l'accueil.</p>
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
          {['super_admin', 'admin', 'editor', 'manager'].includes(role || '') && (
            <button onClick={openAddModal} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700">
              <Plus className="w-5 h-5" /> Nouvelle Promo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((promo: any) => (
          <div key={promo.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm relative group">
            <div className={`absolute top-0 left-0 w-full h-1 ${promo.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            
            {['super_admin', 'editor', 'admin', 'manager'].includes(role || '') && (
              <div className="absolute top-3 right-3 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => openEditModal(promo)} className="p-1.5 text-gray-500 hover:text-blue-600 bg-white/90 backdrop-blur rounded-lg shadow-sm"><Edit2 className="w-4 h-4"/></button>
                <button onClick={() => handleDelete(promo.id)} className="p-1.5 text-gray-500 hover:text-red-600 bg-white/90 backdrop-blur rounded-lg shadow-sm"><Trash2 className="w-4 h-4"/></button>
              </div>
            )}

            <div className="h-40 bg-gray-100 relative">
               {promo.image ? (
                 <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400">
                   <Tag className="w-12 h-12 opacity-50" />
                 </div>
               )}
               {promo.discount && (
                 <div className="absolute bottom-2 left-2 bg-[#FFC72C] text-red-900 font-black px-3 py-1 rounded-xl text-lg shadow-sm">
                   {promo.discount}
                 </div>
               )}
            </div>
            <div className="p-5">
               <h3 className="font-black text-xl text-gray-900 mb-1">{promo.title}</h3>
               <p className="text-gray-500 text-sm line-clamp-2 mb-4">{promo.description}</p>
               <div className="flex items-center justify-between">
                 {promo.code ? (
                    <span className="font-mono text-xs font-bold text-[#DA291C] bg-red-50 border border-red-100 px-2 py-1 rounded">CODE: {promo.code}</span>
                 ) : <div></div>}
                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                   {promo.isActive ? 'Active' : 'Inactivée'}
                 </span>
               </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full p-12 text-center flex flex-col items-center justify-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
            <Tag className="w-12 h-12 mb-4 text-gray-300" />
            <p className="font-bold text-lg">Aucune offre disponible.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-xl">{editingPromo ? 'Modifier l\'offre' : 'Nouvelle Offre'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-2 shadow-sm">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Titre de l'offre</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Mega Promo Etudiant" className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description courte</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all resize-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL de l'image (Ex: https://...)</label>
                <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Texte Bulle (Ex: -20%)</label>
                  <input type="text" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Code Promo (Optionnel)</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-100 bg-gray-50 rounded-xl mt-2">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-[#DA291C]"/>
                <span className="font-bold text-gray-700">Promotion active (visible sur le site)</span>
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
