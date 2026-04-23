import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart, Settings, ShoppingBag, List, Users, 
  LogOut, Plus, Trash2, Edit, Save, X, Eye, 
  ArrowLeft, Bell, Search, Menu as MenuIcon, Lock,
  Download, UploadCloud, ShieldAlert
} from 'lucide-react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useFirestore } from './hooks/useFirestore';

export default function AdminApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'super_admin' | 'admin' | 'editor' | 'viewer' | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch or Bootstrap Role
        const userRef = doc(db, 'users', u.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setRole(snap.data().role as any);
          } else if (u.email === 'beidoufadimatou1998@gmail.com') {
            await setDoc(userRef, { email: u.email, role: 'super_admin' });
            setRole('super_admin');
          } else {
            setRole('viewer'); // default safe fallback
          }
        } catch (e) {
          console.error("Failed to load role", e);
          setRole('viewer');
        }
      } else {
        setRole(null);
      }
      setLoadingApp(false);
    });
    return () => unsub();
  }, []);

  if (loadingApp) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-[#FFC72C] border-t-[#DA291C] rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <AdminLogin />;
  }

  const roleText = {
    'super_admin': 'Super Admin',
    'admin': 'Administrateur',
    'editor': 'Éditeur',
    'viewer': 'Spectateur'
  };

  const navItems = [
    { name: 'Tableau de bord', path: '/admin', icon: <BarChart className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor', 'viewer'] },
    { name: 'Commandes', path: '/admin/orders', icon: <ShoppingBag className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor', 'viewer'] },
    { name: 'Produits', path: '/admin/products', icon: <List className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor', 'viewer'] },
    { name: 'Catégories', path: '/admin/categories', icon: <List className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor', 'viewer'] },
    { name: 'Configuration', path: '/admin/config', icon: <Settings className="w-5 h-5"/>, allow: ['super_admin', 'admin'] },
    { name: 'Utilisateurs', path: '/admin/users', icon: <Users className="w-5 h-5"/>, allow: ['super_admin'] },
  ].filter(item => item.allow.includes(role || 'viewer'));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className={`bg-gray-900 border-r border-gray-800 text-white w-64 shadow-xl shrink-0 hidden md:flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full z-50'}`}>
        <div className="p-6 border-b border-gray-800 flex flex-col justify-start">
          <h2 className="font-black text-xl uppercase tracking-tighter text-[#FFC72C]">Espace Staff</h2>
          <span className="text-xs font-bold text-gray-500 uppercase mt-1">{roleText[role!]}</span>
        </div>
        <nav className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${location.pathname === item.path ? 'bg-[#DA291C] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
           <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <Eye className="w-5 h-5"/> Voir le site
           </Link>
           <button onClick={() => signOut(auth)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full text-left mt-2">
              <LogOut className="w-5 h-5"/> Déconnexion
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header overlay */}
        {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"><MenuIcon className="w-6 h-6"/></button>}
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10 shrink-0">
           <div className="flex items-center gap-4 pl-12 md:pl-0">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 hidden md:block">
                <MenuIcon className="w-5 h-5 text-gray-700"/>
              </button>
              <h1 className="font-black text-2xl text-gray-900 hidden sm:block">Administration</h1>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-sm font-bold text-gray-600 border-r border-gray-200 pr-4 flex flex-col items-end">
                <span className="text-gray-900">{user.email}</span>
                <span className="text-xs text-[#DA291C] uppercase">{roleText[role!]}</span>
              </div>
              <button className="p-2.5 bg-gray-100 rounded-xl relative hover:bg-gray-200 transition-colors">
                 <Bell className="w-5 h-5 text-gray-700"/>
              </button>
           </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
           <Routes>
             <Route path="/" element={<Dashboard role={role} />} />
             <Route path="/orders" element={<AdminOrders role={role} />} />
             <Route path="/products" element={<AdminProducts role={role} />} />
             <Route path="/categories" element={<AdminCategories role={role} />} />
             <Route path="/config" element={['super_admin', 'admin'].includes(role!) ? <AdminConfig role={role} /> : <NoAccess />} />
             <Route path="/users" element={role === 'super_admin' ? <AdminUsers /> : <NoAccess />} />
           </Routes>
        </main>
      </div>
    </div>
  );
}

function NoAccess() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ShieldAlert className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="font-black text-2xl text-gray-900">Accès Refusé</h2>
      <p className="font-bold text-gray-500 max-w-sm mt-2">Votre rôle ne vous permet pas d'accéder à cette section.</p>
    </div>
  );
}

function AdminProducts({ role }: { role: string | null }) {
  const { data: products, loading, add, remove, update } = useFirestore('products', 'name');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const canEdit = ['super_admin', 'admin', 'editor'].includes(role || '');

  const handleEdit = (product: any) => {
    if (!canEdit) return;
    setEditingItem(product);
    setImageBase64(product.image || '');
    setShowModal(true);
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Reduce quality slightly for fast document loads
        setImageBase64(canvas.toDataURL('image/webp', 0.8));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-900">Produits</h2>
        {canEdit && (
        <button onClick={() => { setEditingItem(null); setImageBase64(''); setShowModal(true); }} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 shadow-sm">
          <Plus className="w-4 h-4"/> Ajouter
        </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4"><div className="w-full h-12 bg-gray-200 rounded-xl"></div><div className="w-full h-12 bg-gray-200 rounded-xl"></div></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Catégorie</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold flex items-center gap-3">
                    <img src={p.image || 'https://placehold.co/100x100?text=No+Image'} alt="" className={`w-10 h-10 rounded-lg object-cover bg-gray-100 ${p.isAvailable === false ? 'opacity-50 grayscale' : ''}`}/>
                    <span className={p.isAvailable === false ? 'line-through text-gray-400' : 'text-gray-900'}>{p.name}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-[#DA291C]">{p.price.toLocaleString()} Ar</td>
                  <td className="px-6 py-4">
                     {canEdit ? (
                       <button 
                          onClick={() => update(p.id, { isAvailable: p.isAvailable === false ? true : false, ...p })}
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${p.isAvailable === false ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {p.isAvailable === false ? 'Rupture' : 'Disponible'}
                       </button>
                     ) : (
                       <span className={`px-3 py-1 text-xs font-bold rounded-full ${p.isAvailable === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                         {p.isAvailable === false ? 'Rupture' : 'Disponible'}
                       </span>
                     )}
                  </td>
                  <td className="px-6 py-4"><span className="bg-gray-100 border text-gray-600 px-2 py-1 rounded font-bold text-xs uppercase">{p.categoryId}</span></td>
                  {canEdit && (
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2 font-bold text-sm transition-colors">Modifier</button>
                    <button onClick={() => remove(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={canEdit ? 5 : 4} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">Aucun produit configuré.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl max-h-[95vh] overflow-y-auto">
              <h3 className="font-black text-2xl mb-6 flex items-center justify-between border-b pb-4">
                {editingItem ? 'Modifier Produit' : 'Nouveau Produit'}
                <button type="button" onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5"/></button>
              </h3>
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                await (editingItem ? update(editingItem.id, {
                  name: e.target.name.value,
                  price: Number(e.target.price.value),
                  image: imageBase64 || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
                  description: e.target.description.value,
                  categoryId: e.target.category.value,
                  popular: e.target.popular.checked
                }) : add({
                  name: e.target.name.value,
                  price: Number(e.target.price.value),
                  image: imageBase64 || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
                  description: e.target.description.value,
                  categoryId: e.target.category.value,
                  popular: e.target.popular?.checked || false
                }));
                setShowModal(false);
                setEditingItem(null);
                setImageBase64('');
              }} className="space-y-5">
                 
                 {/* Image Drag & Drop */}
                 <div className="relative group border-2 border-dashed border-gray-300 rounded-2xl p-4 hover:border-[#FFC72C] transition-colors bg-gray-50 cursor-pointer overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
                    <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                    {imageBase64 ? (
                       <img src={imageBase64} className="h-28 object-contain rounded-lg shadow-sm" alt="Aperçu" />
                    ) : (
                       <div className="text-center flex flex-col items-center">
                         <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#DA291C] transition-colors" />
                         <span className="font-bold text-gray-600 text-sm">Cliquer ou Glisser déposer une image</span>
                         <span className="text-xs text-gray-400 font-bold mt-1">PNG, JPG, WEBP (Comprimé auto)</span>
                       </div>
                    )}
                 </div>

                 <div>
                   <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Nom du produit</label>
                   <input name="name" defaultValue={editingItem?.name} className="w-full bg-gray-50 border p-3 font-bold rounded-xl outline-none focus:border-[#FFC72C] transition-colors" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Prix (Ar)</label>
                     <input type="number" name="price" defaultValue={editingItem?.price} className="w-full bg-gray-50 border p-3 font-bold rounded-xl outline-none focus:border-[#FFC72C] transition-colors" required />
                   </div>
                   <div>
                     <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Lien Catégorie (ID)</label>
                     <input name="category" placeholder="ex: burgers" defaultValue={editingItem?.categoryId} className="w-full bg-gray-50 border p-3 font-bold rounded-xl outline-none focus:border-[#FFC72C] transition-colors" required />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Description Courte</label>
                   <textarea name="description" defaultValue={editingItem?.description} className="w-full bg-gray-50 border p-3 font-bold rounded-xl focus:border-[#FFC72C] transition-colors outline-none" rows={2}></textarea>
                 </div>
                 <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-xl border border-gray-200">
                   <input type="checkbox" name="popular" id="popular" defaultChecked={editingItem?.popular} className="w-5 h-5 rounded text-[#DA291C] accent-[#DA291C]" />
                   <label htmlFor="popular" className="text-sm font-black text-gray-800">✅ Mettre en avant sur la page d'accueil</label>
                 </div>
                 <div className="flex bg-gray-50 p-1 rounded-xl mt-4 border border-gray-100">
                    <button type="submit" className="flex-1 py-4 bg-[#DA291C] text-white font-black uppercase tracking-widest rounded-lg shadow-[0_10px_20px_rgba(218,41,28,0.3)] hover:bg-red-700 transition-all hover:scale-[1.01] active:scale-95">
                      {editingItem ? 'Mettre à jour' : 'Enregistrer le produit'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function AdminCategories({ role }: { role: string | null }) {
  const { data: categories, loading, add, remove, update } = useFirestore('categories', 'orderId');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const canEdit = ['super_admin', 'admin', 'editor'].includes(role || '');

  const handleEdit = (category: any) => {
    if (!canEdit) return;
    setEditingItem(category);
    setShowModal(true);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-900">Catégories</h2>
        {canEdit && (
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700">
          <Plus className="w-4 h-4"/> Ajouter
        </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse flex gap-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c.id} className="bg-white p-4 border border-gray-200 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="text-3xl">{c.icon || '🍔'}</div>
                 <div className="font-black">{c.name}</div>
              </div>
              {canEdit && (
              <div className="flex gap-2">
                <button onClick={() => handleEdit(c)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg text-sm font-bold">Modifier</button>
                <button onClick={() => remove(c.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
              </div>
              )}
            </div>
          ))}
          {categories.length === 0 && <p className="text-gray-500 font-bold p-4">Aucune catégorie.</p>}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <h3 className="font-black text-xl mb-4">{editingItem ? 'Modifier Catégorie' : 'Nouvelle Catégorie'}</h3>
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                await (editingItem ? update(editingItem.id, {
                  name: e.target.name.value,
                  icon: e.target.icon.value || '🍔'
                }) : add({
                  name: e.target.name.value,
                  icon: e.target.icon.value || '🍔',
                  orderId: Date.now()
                }));
                setShowModal(false);
                setEditingItem(null);
              }} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Nom</label>
                   <input name="name" defaultValue={editingItem?.name} className="w-full bg-gray-50 border p-3 rounded-xl focus:ring-[#DA291C] outline-none" required />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Emoji / Icône</label>
                   <input name="icon" placeholder="🍔" defaultValue={editingItem?.icon} className="w-full bg-gray-50 border p-3 rounded-xl focus:ring-[#DA291C] outline-none" />
                 </div>
                 <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Annuler</button>
                    <button type="submit" className="px-4 py-2 bg-[#DA291C] text-white font-bold rounded-xl shadow-[0_4px_10px_rgba(218,41,28,0.3)]">Enregistrer</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Normalize email just in case
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isRegistering) {
         await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
         await signInWithEmailAndPassword(auth, normalizedEmail, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
         setError('Email ou mot de passe incorrect.');
      } else if (err.code === 'auth/too-many-requests') {
         setError('Trop de tentatives. Veuillez réessayer plus tard.');
      } else if (err.code === 'auth/email-already-in-use') {
         setError('Un compte existe déjà avec cette adresse e-mail. Cliquez sur "me connecter".');
      } else if (err.code === 'auth/weak-password') {
         setError('Le mot de passe doit comporter au moins 6 caractères.');
      } else {
         setError(`Erreur: ${err.code || err.message}`);
      }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
         setError(`Erreur Google: ${err.message || err.code}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-20 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="w-16 h-16 bg-[#FFC72C] rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner border-[3px] border-white ring-4 ring-yellow-50">
           <Lock className="w-8 h-8 text-[#DA291C]" />
        </div>
        <h1 className="text-2xl font-black text-center uppercase tracking-tight text-gray-900 mb-2">
           Accès Sécurisé
        </h1>
        <p className="text-center text-gray-500 font-bold text-sm mb-6">Connectez-vous pour administrer le menu et les commandes.</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center border border-red-100 flex flex-col gap-2">
             <span>{error}</span>
          </div>
        )}
        
        <div className="space-y-4">
          <button 
             onClick={handleGoogleAuth} 
             disabled={loading} 
             className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3.5 px-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             {loading ? 'Connexion en cours...' : 'Continuer avec Google'}
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-bold">
            Votre compte Google (Gmail) personnel doit être autorisé au préalable pour accéder à l'interface d'administration.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: orders, loading: ordersLoading } = useFirestore('orders');
  const { data: products, loading: productsLoading } = useFirestore('products');
  
  const today = new Date().setHours(0,0,0,0);
  const todayOrders = orders.filter((o: any) => o.timestamp >= today);
  const revenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

  if (ordersLoading || productsLoading) return <div className="animate-pulse flex gap-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div>
      <h2 className="font-black text-3xl mb-6">Vue d'ensemble</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <StatsCard title="Chiffre d'affaires global" value={`${revenue.toLocaleString()} Ar`} color="bg-green-100 text-green-700" />
         <StatsCard title="Commandes J" value={todayOrders.length} color="bg-blue-100 text-blue-700" />
         <StatsCard title="Produits Actifs" value={products.length} color="bg-orange-100 text-orange-700" />
      </div>
    </div>
  );
}

const StatsCard = ({ title, value, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
     <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
     <p className={`font-black text-3xl ${color.split(' ')[1]}`}>{value}</p>
  </div>
);

function AdminOrders({ role }: { role: string | null }) {
  const { data: orders, loading, update, remove } = useFirestore('orders', 'timestamp'); // We sort by timestamp theoretically, useFirestore handles default fallback to no order if missing
  const canEdit = ['super_admin', 'admin', 'editor'].includes(role || '');
  const canDelete = ['super_admin', 'admin'].includes(role || '');

  const downloadCSV = () => {
    if (!orders || orders.length === 0) return;
    
    // Header
    let csvContent = "ID,Date,Client,Mode,Statut,Total,Contenu\n";
    
    // Rows
    orders.forEach((order: any) => {
       const dateStr = new Date(order.timestamp).toLocaleString('fr-FR');
       const itemsStr = order.items?.map((item: any) => `${item.quantity}x ${item.product.name}`).join('; ') || '';
       // Escape double quotes inside strings
       const row = `"${order.id}","${dateStr}","${order.customerName}","${order.orderMode}","${order.status}","${order.total}","${itemsStr}"`;
       csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `export-commandes-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="animate-pulse flex gap-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="font-black text-2xl text-gray-900">Commandes Récentes</h2>
        <button 
          onClick={downloadCSV}
          disabled={orders.length === 0}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 text-sm transition-colors"
        >
          <Download className="w-4 h-4"/> Exporter CSV
        </button>
      </div>
      
      {orders.length === 0 ? (
        <p className="text-gray-500 font-bold p-8 text-center bg-gray-50 rounded-xl border border-dashed">Aucune commande pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.uid} className="flex flex-col sm:flex-row justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div>
                <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                  #{order.id}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'en_route' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>{order.status}</span>
                </h3>
                <p className="text-sm font-bold text-gray-600 mt-1">{order.customerName} • {order.orderMode === 'livraison' ? `🛵 ${order.address}` : '🏃‍♂️ À emporter'}</p>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i}>• {item.quantity}x {item.product?.name}</div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between mt-4 sm:mt-0">
                <span className="font-black text-[#DA291C] text-lg">{order.total.toLocaleString()} Ar</span>
                {(canEdit || canDelete) && (
                <div className="flex gap-2">
                   {canEdit && order.status === 'en_route' ? (
                     <button onClick={() => update(order.id, { status: 'livree' })} className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-lg hover:bg-green-200" title="Marquer comme Livrée">Terminer</button>
                   ) : canEdit ? (
                     <button onClick={() => update(order.id, { status: 'en_route' })} className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-200" title="Marquer en Route">Restaurer</button>
                   ) : null}
                   {canDelete && (
                   <button onClick={() => remove(order.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="Supprimer">
                      <Trash2 className="w-4 h-4"/>
                   </button>
                   )}
                </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function AdminConfig({ role }: { role: string | null }) {
  const { data: configs, loading, update, add } = useFirestore('config', 'brandName');
  const [saving, setSaving] = useState(false);
  const canEdit = ['super_admin', 'admin'].includes(role || '');

  // Default structure if missing
  const config = configs[0] || {
    id: 'main',
    brandName: 'Gastro',
    heroTitle1: 'Méga',
    heroTitle2: 'Gastro.',
    heroSubtitle: 'Le burger le plus attendu de l\'année. Double viande, double fromage fondu. Ça va être énorme.',
    whatsappNumber: '261320735026',
    deliveryFee: 5000,
    seoTitle: 'La Gastronomie - Le meilleur fast-food',
    seoDesc: 'Commandez en ligne vos burgers, pizzas et plats préférés.',
    promoActive: false,
    promoText: '-20% sur tout le menu avec le code MEGA20',
    isRestaurantOpen: true
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    const newConfig = {
      brandName: e.target.brandName.value,
      heroTitle1: e.target.heroTitle1.value,
      heroTitle2: e.target.heroTitle2.value,
      heroSubtitle: e.target.heroSubtitle.value,
      whatsappNumber: e.target.whatsappNumber.value,
      deliveryFee: Number(e.target.deliveryFee.value),
      seoTitle: e.target.seoTitle.value,
      seoDesc: e.target.seoDesc.value,
      promoActive: e.target.promoActive.checked,
      promoText: e.target.promoText.value,
      isRestaurantOpen: e.target.isRestaurantOpen.checked
    };
    if (configs.length === 0) {
      await add(newConfig);
    } else {
      await update(config.id, newConfig);
    }
    setSaving(false);
    alert("Configuration sauvegardée !");
  };

  if (loading) return <div className="animate-pulse flex gap-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="space-y-8 pb-10">
      <h2 className="font-black text-3xl text-gray-900 border-b pb-4">Configuration Générale</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
      
         {/* SECTION 1 : ETAT DU RESTAURANT */}
         <div className="p-6 rounded-2xl border-2 border-orange-200 bg-orange-50 shadow-sm">
           <h3 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2">🚦 État du Service</h3>
           <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-orange-100">
             <input type="checkbox" name="isRestaurantOpen" id="isRestaurantOpen" defaultChecked={config.isRestaurantOpen !== false} className="w-5 h-5 rounded text-[#DA291C]" />
             <label htmlFor="isRestaurantOpen" className="font-black text-sm text-gray-800">Le Restaurant est OUVERT</label>
           </div>
           <p className="text-xs font-bold text-gray-500 mt-2 ml-1">Décocher pour afficher un message "Restaurant fermé" et bloquer le panier.</p>
         </div>

         {/* SECTION 2 : MARKETING & CMS */}
         <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4">
           <h3 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2">📱 Textes & Design Accueil</h3>
           <div>
             <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Nom de la marque</label>
             <input name="brandName" defaultValue={config.brandName || "Gastro"} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-sans" required />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Titre Accueil Ligne 1</label>
               <input name="heroTitle1" defaultValue={config.heroTitle1 || "Méga"} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-sans" required />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Titre Accueil Ligne 2</label>
               <input name="heroTitle2" defaultValue={config.heroTitle2 || "Gastro."} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-sans" required />
             </div>
           </div>
           <div>
             <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Sous-titre Accueil</label>
             <textarea name="heroSubtitle" defaultValue={config.heroSubtitle || ""} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-sans" rows={3}></textarea>
           </div>
           
           <div className="border-t border-gray-100 pt-4 mt-6">
               <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Bannière Promotionnelle (En haut du site)</label>
               <div className="flex items-center gap-3 mb-3">
                 <input type="checkbox" name="promoActive" id="promoActive" defaultChecked={config.promoActive} className="w-4 h-4 rounded text-[#DA291C]" />
                 <label htmlFor="promoActive" className="font-bold text-sm text-gray-800">Activer la bannière</label>
               </div>
               <input name="promoText" defaultValue={config.promoText || "-20% sur la livraison avec MEGA20"} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-sans" placeholder="Texte de la promotion..." />
           </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* SECTION 3 : SEO */}
           <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4">
             <h3 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2">🔍 Référencement (SEO)</h3>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Titre (Title)</label>
               <input name="seoTitle" defaultValue={config.seoTitle || "La Gastronomie"} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-sans" required />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Description</label>
               <textarea name="seoDesc" defaultValue={config.seoDesc || "Commandez vos burgers..."} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-sans" rows={3}></textarea>
             </div>
           </div>

           {/* SECTION 4 : TARIFS & CONTACT */}
           <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4">
             <h3 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2">⚙️ Tarifs & Contact</h3>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">N° WhatsApp Complet</label>
               <input name="whatsappNumber" defaultValue={config.whatsappNumber} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-mono" placeholder="26132000000" required />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Frais de livraison (Ar)</label>
               <input type="number" name="deliveryFee" defaultValue={config.deliveryFee || 0} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-mono" required />
             </div>
           </div>
         </div>

         <div className="flex justify-end gap-4 mt-8">
           {!canEdit && (
              <div className="text-red-500 font-bold text-sm bg-red-50 px-6 py-4 rounded-xl flex items-center border border-red-100">
                Mode lecture seule : Ce rôle ne permet pas de modifier la configuration.
              </div>
           )}
           {canEdit && (
             <button disabled={saving} type="submit" className="w-full md:w-auto px-10 bg-[#DA291C] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-md hover:bg-red-700 disabled:opacity-50 flex justify-center items-center gap-2 ml-auto">
                <Save className="w-5 h-5"/> {saving ? 'Sauvegarde...' : 'Enregistrer les configurations'}
             </button>
           )}
         </div>
      </form>
    </div>
  );
}

function AdminUsers() {
  const { data: users, loading, update, remove } = useFirestore('users', 'email');

  if (loading) return <div className="animate-pulse flex gap-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="font-black text-2xl mb-6 text-gray-900 border-b pb-4">Gestion des utilisateurs (Staff)</h2>
      <p className="text-sm font-bold text-gray-500 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 leading-relaxed">
        Les nouveaux utilisateurs doivent créer un compte sur la page de connexion Espace Staff.
        Par défaut, ils recevront le rôle "Spectateur" (viewer). Vous pouvez modifier leur rôle ici.
      </p>

      {users.length === 0 ? (
        <p className="text-gray-500 font-bold p-8 text-center bg-gray-50 rounded-xl border border-dashed">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{u.id}</td>
                  <td className="px-6 py-4 font-bold">{u.email}</td>
                  <td className="px-6 py-4">
                    <select 
                      className="bg-gray-100 border-none font-bold text-sm rounded-lg px-3 py-1 cursor-pointer focus:ring-2 focus:ring-[#FFC72C] outline-none"
                      value={u.role || 'viewer'}
                      onChange={(e) => update(u.id, { role: e.target.value })}
                      disabled={u.email === 'beidoufadimatou1998@gmail.com'}
                    >
                      <option value="viewer">Spectateur</option>
                      <option value="editor">Éditeur</option>
                      <option value="admin">Administrateur</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                       onClick={() => { if(window.confirm('Voulez-vous révoquer l\'accès de cet utilisateur ?')) remove(u.id); }} 
                       className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors  disabled:opacity-50"
                       disabled={u.email === 'beidoufadimatou1998@gmail.com'}
                    >
                       <Trash2 className="w-4 h-4"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
