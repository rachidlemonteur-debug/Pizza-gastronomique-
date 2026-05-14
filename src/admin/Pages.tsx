import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Search, Plus, Edit2, Trash2, X, FileText } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export default function Pages() {
  const { role } = useAdmin();
  const { data: pages, loading } = useFirestore('page_content', 'title');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    pageKey: '',
    content: ''
  });

  if (loading) return <div className="font-bold text-gray-500">Chargement...</div>;

  const filtered = pages.filter((p: any) => 
    p.title?.toLowerCase().includes(search.toLowerCase()) || 
    p.pageKey?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette page ?") && ['super_admin', 'editor', 'admin'].includes(role || '')) {
      try {
        await deleteDoc(doc(db, 'page_content', id));
      } catch (e: any) {
        alert("Erreur: " + e.message);
      }
    }
  };

  const openAddModal = () => {
    setEditingPage(null);
    setFormData({ title: '', pageKey: '', content: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (page: any) => {
    setEditingPage(page);
    setFormData({
      title: page.title || '',
      pageKey: page.pageKey || '',
      content: page.content || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        pageKey: formData.pageKey.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        content: formData.content,
        updatedAt: Date.now()
      };

      if (editingPage) {
        await updateDoc(doc(db, 'page_content', editingPage.id), payload);
      } else {
        await addDoc(collection(db, 'page_content'), { ...payload, createdAt: Date.now() });
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
          <h1 className="text-2xl font-black text-gray-900 mb-1">Pages & Contenu</h1>
          <p className="text-gray-500 font-medium">Gestion du contenu des pages CMS (Mentions légales, FAQ, etc).</p>
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
              <Plus className="w-5 h-5" /> Nouvelle Page
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
             <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-gray-500 tracking-wider">
               <tr>
                 <th className="p-4">Titre</th>
                 <th className="p-4">URL (Clé)</th>
                 <th className="p-4">Dernière modification</th>
                 <th className="p-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {filtered.map((page: any) => (
                 <tr key={page.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="p-4">
                     <div className="font-bold text-gray-900 flex items-center gap-2">
                       <FileText className="w-4 h-4 text-gray-400" />
                       {page.title}
                     </div>
                   </td>
                   <td className="p-4">
                     <span className="font-mono text-xs text-[#DA291C] bg-red-50 border border-red-100 px-2 py-1 rounded">/p/{page.pageKey}</span>
                   </td>
                   <td className="p-4 text-gray-500 text-sm">
                     {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : 'N/A'}
                   </td>
                   <td className="p-4 text-right">
                     {['super_admin', 'editor', 'admin'].includes(role || '') && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(page)} className="p-2 text-gray-400 hover:text-blue-600 bg-white rounded-lg border border-gray-200"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(page.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-200"><Trash2 className="w-4 h-4"/></button>
                        </div>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
              <FileText className="w-12 h-12 mb-4 text-gray-300" />
              <p className="font-bold text-lg">Aucune page trouvée.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="font-black text-xl">{editingPage ? 'Modifier la page' : 'Nouvelle Page'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white rounded-full p-2 shadow-sm">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Titre de la page</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Mentions Légales" className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Clé URL (slug)</label>
                  <input required type="text" value={formData.pageKey} onChange={e => setFormData({...formData, pageKey: e.target.value})} placeholder="Ex: mentions-legales" className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all"/>
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-1">Contenu (Markdown ou HTML simple)</label>
                <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="flex-1 min-h-[300px] w-full border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none transition-all resize-none"></textarea>
              </div>

              <div className="pt-4 flex gap-3 shrink-0">
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
