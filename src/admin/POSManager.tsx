import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export default function POSManager() {
  const { role } = useAdmin();
  const { data: posList, loading } = useFirestore('points_of_sale', 'name');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    district: '',
    phone: '',
    lat: -18.8792,
    lng: 47.5079,
    hours: { open: '08:00', close: '22:00' },
    isOpen: true
  });

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  if (!['super_admin', 'admin'].includes(role || '')) {
    return <div className="p-8 text-center bg-red-50 text-red-700 font-bold rounded-2xl">Accès refusé. Réservé aux administrateurs.</div>;
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer ce point de vente ?")) {
      try {
        await deleteDoc(doc(db, 'points_of_sale', id));
      } catch (e: any) {
        alert("Erreur: " + e.message);
      }
    }
  };

  const openAddModal = () => {
    setEditingPos(null);
    setFormData({
      name: '', address: '', district: '', phone: '', lat: -18.8792, lng: 47.5079, hours: { open: '08:00', close: '22:00' }, isOpen: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pos: any) => {
    setEditingPos(pos);
    setFormData({
      name: pos.name || '',
      address: pos.address || '',
      district: pos.district || '',
      phone: pos.phone || '',
      lat: pos.lat || -18.8792,
      lng: pos.lng || 47.5079,
      hours: pos.hours || { open: '08:00', close: '22:00' },
      isOpen: pos.isOpen ?? true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        lat: Number(formData.lat),
        lng: Number(formData.lng)
      };
      
      if (editingPos) {
        await updateDoc(doc(db, 'points_of_sale', editingPos.id), payload);
      } else {
        await addDoc(collection(db, 'points_of_sale'), payload);
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
            <h1 className="text-2xl font-black text-gray-900 mb-1">Points de Vente</h1>
            <p className="text-gray-500 font-medium">Gérez la liste de vos restaurants.</p>
         </div>
         <button onClick={openAddModal} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 w-full sm:w-auto">
            <Plus className="w-5 h-5" /> Ajouter un point de vente
         </button>
       </div>
       
       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
             <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-gray-500 tracking-wider">
               <tr>
                 <th className="p-4">Nom & Quartier</th>
                 <th className="p-4">Téléphone</th>
                 <th className="p-4">Horaires</th>
                 <th className="p-4 text-center">Statut</th>
                 <th className="p-4 text-right">Actions</th>
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
                   <td className="p-4 text-center">
                      {pos.isOpen ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold uppercase">Ouvert</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold uppercase">Fermé</span>
                      )}
                   </td>
                   <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(pos)} className="p-2 text-gray-400 hover:text-blue-600 bg-white rounded-lg border border-gray-200"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(pos.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-200"><Trash2 className="w-4 h-4"/></button>
                      </div>
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
              <h3 className="font-black text-xl">{editingPos ? 'Modifier point de vente' : 'Nouveau point de vente'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-2 shadow-sm">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom du restaurant</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Quartier</label>
                  <input type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Adresse complète</label>
                <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all resize-none"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Latitude</label>
                  <input required type="number" step="0.000001" value={formData.lat} onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Longitude</label>
                  <input required type="number" step="0.000001" value={formData.lng} onChange={e => setFormData({...formData, lng: parseFloat(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Heure d'ouverture</label>
                  <input type="time" value={formData.hours.open} onChange={e => setFormData({...formData, hours: {...formData.hours, open: e.target.value}})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Heure de fermeture</label>
                  <input type="time" value={formData.hours.close} onChange={e => setFormData({...formData, hours: {...formData.hours, close: e.target.value}})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-100 bg-gray-50 rounded-xl mt-2">
                <input type="checkbox" checked={formData.isOpen} onChange={e => setFormData({...formData, isOpen: e.target.checked})} className="w-5 h-5 accent-[#DA291C]"/>
                <span className="font-bold text-gray-700">Le point de vente est actuellement ouvert</span>
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
