import React, { useState, useEffect } from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const { role } = useAdmin();
  const { data: configData, loading } = useFirestore('config');
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (configData && configData.length > 0) {
      setFormData(configData[0]);
    } else if (configData && configData.length === 0 && !loading) {
      setFormData({
        brandName: 'La Gastronomie Pizza',
        whatsappNumber: '+261340000000',
        deliveryFee: 2000,
        isRestaurantOpen: true,
        promoActive: false,
        promoText: '',
        heroTitle1: 'Méga',
        heroTitle2: 'Gastro',
        heroSubtitle: "Le burger le plus attendu de l'année."
      });
    }
  }, [configData, loading]);

  if (loading || !formData) return <div className="font-bold text-gray-500">Chargement...</div>;

  if (!['super_admin', 'admin'].includes(role || '')) {
    return <div className="p-8 text-center bg-red-50 text-red-700 font-bold rounded-2xl">Accès refusé. Réservé aux administrateurs.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = Number(value);
    }
    
    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (formData.id) {
        const { id, ...dataToUpdate } = formData;
        await updateDoc(doc(db, 'config', id), dataToUpdate);
      } else {
        await setDoc(doc(db, 'config', 'global'), formData);
        setFormData({ ...formData, id: 'global' });
      }
      alert('Paramètres enregistrés avec succès !');
    } catch (e: any) {
      alert("Erreur lors de l'enregistrement : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Paramètres</h1>
          <p className="text-gray-500 font-medium">Configuration globale du système.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[#DA291C] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-black text-gray-900 mb-2 border-b border-gray-100 pb-2">Informations Générales</h2>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nom de l'entreprise</label>
            <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Numéro WhatsApp Central</label>
            <input type="text" name="whatsappNumber" value={formData.whatsappNumber || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Frais de livraison de base (Ar)</label>
            <input type="number" name="deliveryFee" value={formData.deliveryFee || 0} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none"/>
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-100 bg-gray-50 rounded-xl mt-4">
            <input type="checkbox" name="isRestaurantOpen" checked={formData.isRestaurantOpen ?? true} onChange={handleChange} className="w-5 h-5 accent-[#DA291C]"/>
            <span className="font-bold text-gray-700">Le restaurant accepte les commandes</span>
          </label>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-black text-gray-900 mb-2 border-b border-gray-100 pb-2">Bannière Promo</h2>
          <label className="flex items-center gap-3 cursor-pointer mb-2">
            <input type="checkbox" name="promoActive" checked={formData.promoActive || false} onChange={handleChange} className="w-4 h-4 accent-[#DA291C]"/>
            <span className="font-bold text-gray-700">Activer la bannière promotionnelle</span>
          </label>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Texte de la promotion</label>
            <textarea rows={2} name="promoText" value={formData.promoText || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none resize-none"></textarea>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 md:col-span-2">
          <h2 className="font-black text-gray-900 mb-2 border-b border-gray-100 pb-2">Page d'accueil (Hero Section)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Titre 1 (mot en blanc)</label>
              <input type="text" name="heroTitle1" value={formData.heroTitle1 || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Titre 2 (mot en jaune)</label>
              <input type="text" name="heroTitle2" value={formData.heroTitle2 || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Sous-titre d'accroche</label>
            <textarea rows={2} name="heroSubtitle" value={formData.heroSubtitle || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 font-medium focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] outline-none resize-none"></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
