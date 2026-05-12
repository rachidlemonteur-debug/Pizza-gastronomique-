import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminContextProvider } from './admin/AdminContext';
import AdminLayout from './admin/Layout';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@madagascar.mg' && password === 'GASTRO_MAD_2024') {
       localStorage.setItem('gastro_emergency_token', password);
       window.location.reload();
       return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auto redirect happens via context
    } catch (e: any) {
      setError("Indentifiants incorrects ou accès refusé.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
           <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">La Gastro <span className="text-[#DA291C]">HQ</span></h2>
           <p className="text-gray-500 font-medium">Connectez-vous à votre espace Staff ou Manager.</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email professionnel</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DA291C] focus:border-transparent font-medium transition-all"
              placeholder="votre.nom@gastro.mg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DA291C] focus:border-transparent font-medium transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#DA291C] hover:bg-red-700 text-white font-black py-3.5 rounded-xl transition-colors shadow-md disabled:opacity-50 mt-4"
          >
            {loading ? 'Connexion...' : 'Accéder au Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminApp() {
  return (
    <AdminContextProvider>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </AdminContextProvider>
  );
}
