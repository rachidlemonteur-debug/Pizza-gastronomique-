import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Bike, Search, Plus, MapPin, Edit2, Trash2, X } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export default function Drivers() {
  const { selectedPosId, posList, role } = useAdmin();
  const { data: drivers, loading } = useFirestore('drivers', 'createdAt');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    posId: '',
    status: 'offline'
  });

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  let filtered = selectedPosId === 'ALL' ? drivers : drivers.filter((d: any) => d.posId === selectedPosId);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((d: any) => d.name?.toLowerCase().includes(s) || d.phone?.includes(s));
  }

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'available' ? 'offline' : 'available';
    try {
      await updateDoc(doc(db, 'drivers', id), { status: newStatus });
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer ce livreur ?") && ['super_admin', 'editor', 'admin'].includes(role || '')) {
      try {
        await deleteDoc(doc(db, 'drivers', id));
      } catch (e: any) {
        alert("Erreur: " + e.message);
      }
    }
  };

  const getPosName = (id: string) => {
    return posList.find(p => p.id === id)?.name || 'Inconnu';
  };

  const openAddModal = () => {
    setEditingDriver(null);
    setFormData({ name: '', phone: '', posId: posList[0]?.id || '', status: 'offline' });
    setIsModalOpen(true);
  };

  const openEditModal = (driver: any) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      posId: driver.posId || '',
      status: driver.status || 'offline'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        createdAt: editingDriver ? editingDriver.createdAt : Date.now()
      };

      if (editingDriver) {
        await updateDoc(doc(db, 'drivers', editingDriver.id), payload);
      } else {
        await addDoc(collection(db, 'drivers'), payload);
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
          <h1 className="text-2xl font-black text-gray-900 mb-1">Livreurs</h1>
          <p className="text-gray-500 font-medium">Gestion de la flotte.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Nom, téléphone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((driver: any) => (
          <div key={driver.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative overflow-hidden group">
             {/* Status indicator line */}
             <div className={`absolute top-0 left-0 w-full h-1 ${driver.status === 'available' ? 'bg-green-500' : driver.status === 'delivering' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
             
             {['super_admin', 'editor', 'admin'].includes(role || '') && (
               <div className="absolute top-3 right-3 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                 <button onClick={() => openEditModal(driver)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-white rounded-lg"><Edit2 className="w-4 h-4"/></button>
                 <button onClick={() => handleDelete(driver.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4"/></button>
               </div>
             )}

             <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                   <Bike className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="font-black text-gray-900 text-lg leading-tight">{driver.name}</h3>
                   <p className="text-gray-500 text-sm font-medium leading-tight">{driver.phone}</p>
                 </div>
               </div>
             </div>
             
             <div className="space-y-2 mb-6">
               <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                 <MapPin className="w-4 h-4 text-[#DA291C]"/> Zone : {getPosName(driver.posId)}
               </div>
               <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                 <div className={`w-2 h-2 rounded-full ${driver.status === 'available' ? 'bg-green-500' : driver.status === 'delivering' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                 Statut : <span className="uppercase font-bold text-gray-800">{driver.status || 'offline'}</span>
               </div>
             </div>
             
             <button 
               onClick={() => toggleStatus(driver.id, driver.status)}
               className={`mt-auto w-full py-2 rounded-lg font-bold text-sm transition-colors ${driver.status === 'available' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
             >
               {driver.status === 'available' ? 'Passer Hors Ligne' : 'Passer En Ligne'}
             </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
            Aucun livreur.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-xl">{editingDriver ? 'Modifier le livreur' : 'Nouveau livreur'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-2 shadow-sm">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom du livreur</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Affectation (Zone)</label>
                  <select required value={formData.posId} onChange={e => setFormData({...formData, posId: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all">
                    <option value="">Sélectionner</option>
                    {posList.map((pos:any) => (
                       <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </div>
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
