import React from 'react';
import { useAdmin } from './AdminContext';

export default function AdminSettings() {
  const { role } = useAdmin();

  if (!['super_admin', 'admin'].includes(role || '')) {
    return <div className="p-8 text-center bg-red-50 text-red-700 font-bold rounded-2xl">Accès refusé.</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Paramètres</h1>
        <p className="text-gray-500 font-medium">Configuration globale du système.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Informations Générales</h2>
        <div className="space-y-4">
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Nom de l'entreprise</label>
             <input type="text" disabled value="La Gastronomie Pizza" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-medium"/>
           </div>
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Numéro WhatsApp Central</label>
             <input type="text" disabled value="+261 34 00 000 00" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-medium"/>
           </div>
           <p className="text-sm font-bold text-gray-400 mt-2">Mode Lecture Seule. L'édition est en cours de refonte.</p>
        </div>
      </div>
    </div>
  );
}
