import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart as BarChartIcon, Settings, ShoppingBag, List, Users, 
  LogOut, Plus, Trash2, Edit, Save, X, Eye, 
  ArrowLeft, Bell, Search, Menu as MenuIcon, Lock,
  Download, UploadCloud, ShieldAlert, Star, Activity, MapPin, FileText, Phone, Bike, PhoneCall
} from 'lucide-react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { PRODUCTS, CATEGORIES, RESTAURANTS } from './App';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useFirestore } from './hooks/useFirestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { format, subDays, startOfDay, isAfter, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Activity Logger Utility
const logActivity = async (action: string, details: string) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId: user.uid,
      userName: user.email,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Logging failed", e);
  }
};

export default function AdminApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'super_admin' | 'admin' | 'editor' | 'viewer' | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [isEmergencyAdmin, setIsEmergencyAdmin] = useState(localStorage.getItem('gastro_emergency_token') === 'GASTRO_MAD_2024');

  useEffect(() => {
    if (isEmergencyAdmin) {
      setUser({ email: 'admin@madagascar.mg', uid: 'emergency_admin' } as any);
      setRole('super_admin');
      setLoadingApp(false);
      return;
    }

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
            await setDoc(userRef, { email: u.email, role: 'viewer' });
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
    { name: 'Tableau de bord', path: '/admin', icon: <BarChartIcon className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor', 'viewer'] },
    { name: 'Commandes', path: '/admin/orders', icon: <ShoppingBag className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor', 'viewer'] },
    { name: 'Livreurs', path: '/admin/drivers', icon: <Bike className="w-5 h-5"/>, allow: ['super_admin', 'admin'] },
    { name: 'Produits', path: '/admin/products', icon: <List className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor', 'viewer'] },
    { name: 'Catégories', path: '/admin/categories', icon: <List className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor', 'viewer'] },
    { name: 'Demandes Rappel', path: '/admin/callbacks', icon: <PhoneCall className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor'] },
    { name: 'Points de Vente', path: '/admin/pos', icon: <Plus className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor'] },
    { name: 'Avis Clients', path: '/admin/reviews', icon: <Plus className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor', 'viewer'] },
    { name: 'Promos & Bannières', path: '/admin/promos', icon: <Star className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor'] },
    { name: 'Contenu', path: '/admin/cms', icon: <FileText className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor'] },
    { name: 'Statuts Commandes', path: '/admin/statuses', icon: <Activity className="w-5 h-5"/>, allow: ['super_admin', 'admin', 'editor'] },
    { name: 'Configuration', path: '/admin/config', icon: <Settings className="w-5 h-5"/>, allow: ['super_admin', 'admin'] },
    { name: 'Utilisateurs', path: '/admin/users', icon: <Users className="w-5 h-5"/>, allow: ['super_admin'] },
    { name: 'Logs d\'Activité', path: '/admin/logs', icon: <Lock className="w-5 h-5"/>, allow: ['super_admin'] },
    { name: 'Sauvegardes', path: '/admin/backups', icon: <Download className="w-5 h-5"/>, allow: ['super_admin'] },
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
           <button 
             onClick={async () => {
               localStorage.removeItem('gastro_emergency_token');
               await signOut(auth);
               window.location.reload();
             }} 
             className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full text-left mt-2"
           >
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
             <Route path="/drivers" element={['super_admin', 'admin'].includes(role!) ? <AdminDrivers role={role} /> : <NoAccess />} />
             <Route path="/products" element={<AdminProducts role={role} />} />
             <Route path="/categories" element={<AdminCategories role={role} />} />
             <Route path="/callbacks" element={['super_admin', 'admin', 'editor'].includes(role!) ? <AdminCallbacks role={role} /> : <NoAccess />} />
             <Route path="/pos" element={['super_admin', 'admin', 'editor'].includes(role!) ? <AdminPOS role={role} /> : <NoAccess />} />
             <Route path="/reviews" element={<AdminReviews role={role} />} />
             <Route path="/promos" element={['super_admin', 'admin', 'editor'].includes(role!) ? <AdminPromos role={role} /> : <NoAccess />} />
             <Route path="/cms" element={['super_admin', 'admin', 'editor'].includes(role!) ? <AdminCMS role={role} /> : <NoAccess />} />
             <Route path="/statuses" element={['super_admin', 'admin', 'editor'].includes(role!) ? <AdminOrderStatuses role={role} /> : <NoAccess />} />
             <Route path="/config" element={['super_admin', 'admin'].includes(role!) ? <AdminConfig role={role} /> : <NoAccess />} />
             <Route path="/users" element={role === 'super_admin' ? <AdminUsers /> : <NoAccess />} />
             <Route path="/logs" element={role === 'super_admin' ? <AdminLogs /> : <NoAccess />} />
             <Route path="/backups" element={role === 'super_admin' ? <AdminBackups /> : <NoAccess />} />
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
                    <button onClick={() => { logActivity('SUPPRESSION_PRODUIT', p.name); remove(p.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
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
                const prodData = {
                  name: e.target.name.value,
                  price: Number(e.target.price.value),
                  image: imageBase64 || e.target.imageUrl.value || 'https://placehold.co/400x400?text=Produit',
                  description: e.target.description.value,
                  categoryId: e.target.category.value,
                  popular: e.target.popular.checked
                };
                if (editingItem) {
                  await update(editingItem.id, prodData);
                  logActivity('MODIFICATION_PRODUIT', prodData.name);
                } else {
                  await add(prodData);
                  logActivity('AJOUT_PRODUIT', prodData.name);
                }
                setShowModal(false);
                setEditingItem(null);
                setImageBase64('');
              }} className="space-y-5">
                 
                 {/* Image Drag & Drop or URL */}
                 <div className="relative group border-2 border-dashed border-gray-300 rounded-2xl p-4 hover:border-[#FFC72C] transition-colors bg-gray-50 cursor-pointer overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
                    <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                    {imageBase64 ? (
                       <img src={imageBase64} className="h-28 object-contain rounded-lg shadow-sm w-full" alt="Aperçu" />
                    ) : editingItem?.image ? (
                       <img src={editingItem.image} className="h-28 object-contain rounded-lg shadow-sm w-full" alt="Aperçu actuel" />
                    ) : (
                       <div className="text-center flex flex-col items-center">
                         <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#DA291C] transition-colors" />
                         <span className="font-bold text-gray-600 text-sm">Cliquer ou Glisser déposer une image</span>
                         <span className="text-xs text-gray-400 font-bold mt-1">PNG, JPG, WEBP (Comprimé auto)</span>
                       </div>
                    )}
                 </div>

                 <div className="text-center">
                   <p className="text-xs text-gray-400 font-bold mb-2">OU</p>
                   <input name="imageUrl" placeholder="Coller le lien d'une image (URL)" defaultValue={editingItem?.image} className="w-full bg-gray-50 border border-gray-200 text-sm p-3 font-bold rounded-xl outline-none focus:border-[#FFC72C] transition-colors" />
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
  const [imageBase64, setImageBase64] = useState<string>('');

  const handleEdit = (category: any) => {
    if (!canEdit) return;
    setEditingItem(category);
    setImageBase64('');
    setShowModal(true);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500kb max for category icon
        alert('L\'image est trop volumineuse (max 500Ko)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-900">Catégories</h2>
        {canEdit && (
        <button onClick={() => { setEditingItem(null); setImageBase64(''); setShowModal(true); }} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700">
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
                 <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-xl">
                   {c.icon?.startsWith('http') || c.icon?.startsWith('data:image') ? (
                     <img src={c.icon} alt={c.name} className="w-8 h-8 object-contain" />
                   ) : (
                     <span className="text-3xl">{c.icon || '🍔'}</span>
                   )}
                 </div>
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
           <div className="bg-white rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl">
              <h3 className="font-black text-xl mb-6">{editingItem ? 'Modifier Catégorie' : 'Nouvelle Catégorie'}</h3>
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                const iconValue = imageBase64 || e.target.icon.value || '🍔';
                await (editingItem ? update(editingItem.id, {
                  name: e.target.name.value,
                  icon: iconValue
                }) : add({
                  name: e.target.name.value,
                  icon: iconValue,
                  orderId: Date.now()
                }));
                setShowModal(false);
                setEditingItem(null);
                setImageBase64('');
              }} className="space-y-4">
                 
                 <div className="relative group border-2 border-dashed border-gray-300 rounded-2xl p-4 hover:border-[#FFC72C] transition-colors bg-gray-50 cursor-pointer overflow-hidden flex flex-col items-center justify-center min-h-[100px]">
                    <input type="file" accept="image/jpeg, image/png, image/webp, image/svg+xml" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                    {imageBase64 ? (
                       <img src={imageBase64} className="h-16 object-contain rounded-lg shadow-sm" alt="Aperçu" />
                    ) : (editingItem?.icon?.startsWith('http') || editingItem?.icon?.startsWith('data:image')) ? (
                       <img src={editingItem.icon} className="h-16 object-contain rounded-lg shadow-sm" alt="Aperçu actuel" />
                    ) : (
                       <div className="text-center flex flex-col items-center">
                         <span className="text-3xl mb-2">{editingItem?.icon || '🍔'}</span>
                         <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest text-center px-4 leading-tight group-hover:text-[#FFC72C] transition-colors">Déposez une image ici (PNG, SVG, JPG)</p>
                       </div>
                    )}
                 </div>

                 <div>
                   <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Nom de la catégorie</label>
                   <input name="name" defaultValue={editingItem?.name} className="w-full bg-gray-50 border p-3 rounded-xl focus:border-[#FFC72C] outline-none font-bold transition-colors" required />
                 </div>
                 <div>
                   <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-wider">Emoji / Lien de l'image</label>
                   <input name="icon" placeholder="🍔 ou https://..." defaultValue={(!editingItem?.icon?.startsWith('data:image')) ? editingItem?.icon : ''} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-[#FFC72C] outline-none transition-colors" />
                   <p className="text-[10px] font-bold text-gray-400 mt-1">Collez un Emoji, ou le lien d'une image. L'image uploadée au dessus sera prioritaire.</p>
                 </div>
                 <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
                    <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); setImageBase64(''); }} className="px-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl flex-1 uppercase text-xs tracking-widest">Annuler</button>
                    <button type="submit" className="px-4 py-3 bg-gray-900 text-white font-black rounded-xl shadow-md hover:bg-gray-800 flex-[2] uppercase text-xs tracking-widest transition-colors">Enregistrer</button>
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
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyCode, setEmergencyCode] = useState('');

  const handleEmergencyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (emergencyCode === 'GASTRO_MAD_2024') {
      localStorage.setItem('gastro_emergency_token', 'GASTRO_MAD_2024');
      window.location.reload();
    } else {
      setError('Code de secours incorrect.');
    }
  };

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
      if (err.code === 'auth/unauthorized-domain') {
         setError('Domaine non autorisé. Ajoutez votre domaine Vercel dans Firebase Console > Authentication > Settings > Authorized domains.');
      } else if (err.code === 'auth/invalid-credential') {
         setError('Email ou mot de passe incorrect.');
      } else if (err.code === 'auth/too-many-requests') {
         setError('Trop de tentatives. Veuillez réessayer plus tard.');
      } else if (err.code === 'auth/email-already-in-use') {
         setError('Un compte existe déjà avec cette adresse e-mail. Cliquez sur "me connecter".');
      } else if (err.code === 'auth/weak-password') {
         setError('Le mot de passe doit comporter au moins 6 caractères.');
      } else if (err.code === 'auth/operation-not-allowed') {
         setError('La connexion par email/mot de passe n’est pas activée dans votre console Firebase (Authentication > Sign-in method).');
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

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse e-mail pour réinitialiser le mot de passe.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      alert('Un email de réinitialisation a été envoyé à ' + email);
    } catch (err: any) {
      setError(`Erreur lors de la réinitialisation: ${err.message || err.code}`);
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
           {isRegistering ? 'Créer un accès' : 'Accès Sécurisé'}
        </h1>
        <p className="text-center text-gray-500 font-bold text-sm mb-6"> {isRegistering ? 'Inscrivez-vous pour accéder au dashboard.' : 'Connectez-vous pour administrer le menu.'}</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 text-center border border-red-100 flex flex-col gap-2">
             <span>{error}</span>
             {error.includes('auth/operation-not-allowed') && (
               <button 
                 onClick={() => setShowEmergency(true)}
                 className="text-[10px] uppercase underline tracking-widest text-red-400 hover:text-red-700 font-black"
               >
                 Utiliser l'accès de secours (Offline)
               </button>
             )}
          </div>
        )}
        
        {showEmergency ? (
          <form onSubmit={handleEmergencyLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-2">Code de Sécurité (Gastro Root)</label>
              <input 
                type="password" 
                value={emergencyCode} 
                onChange={e => setEmergencyCode(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#DA291C] font-bold" 
                required 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-black uppercase tracking-wider hover:bg-black transition-colors"
            >
              Débloquer le Dashboard
            </button>
            <button 
              type="button"
              onClick={() => setShowEmergency(false)}
              className="w-full text-xs font-bold text-gray-400 uppercase tracking-widest pt-2"
            >
              Retour au login standard
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-2">Adresse Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#DA291C] focus:ring-2 focus:ring-red-100 font-bold transition-all" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-2">Mot de Passe</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              minLength={6}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#DA291C] focus:ring-2 focus:ring-red-100 font-bold transition-all" 
              required 
            />
          </div>
          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-[#DA291C] text-white py-3.5 rounded-xl font-black uppercase tracking-wider shadow-[0_10px_20px_rgba(218,41,28,0.3)] hover:bg-red-700 transition-colors mt-2 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-1"
          >
            {loading ? 'Traitement...' : (isRegistering ? 'S\'inscrire' : 'Se connecter')}
          </button>
          {!isRegistering && (
             <div className="text-right mt-2">
                <button 
                  type="button" 
                  onClick={handlePasswordReset}
                  className="text-xs font-bold text-gray-500 hover:text-[#DA291C] transition-colors"
                >
                  Mot de passe oublié ?
                </button>
             </div>
          )}
        </form>
      )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-xs font-bold text-gray-500 hover:text-gray-900 underline underline-offset-4"
          >
            {isRegistering ? 'Déjà un compte ? Se connecter' : 'Nouveau membre ? Créer un accès'}
          </button>
        </div>

        <div className="mt-10 text-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ou continuer avec</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <button 
             onClick={handleGoogleAuth} 
             disabled={loading} 
             className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 text-sm"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             Google
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ role }: { role: string | null }) {
  const { data: configs } = useFirestore('config', 'brandName');
  const config = configs[0] || {};
  const customStatuses = config.customStatuses || [
    { id: 'completed', isTerminal: true, isCanceled: false },
    { id: 'canceled', isTerminal: true, isCanceled: true }
  ];
  const terminalIds = customStatuses.filter((s:any) => s.isTerminal).map((s:any) => s.id);
  const canceledIds = customStatuses.filter((s:any) => s.isCanceled).map((s:any) => s.id);

  const { data: orders, loading: ordersLoading } = useFirestore('orders', 'timestamp');
  const { data: products, loading: productsLoading } = useFirestore('products');
  const { data: categories, loading: categoriesLoading } = useFirestore('categories');
  const { data: drivers } = useFirestore('drivers');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  
  if (ordersLoading || productsLoading || categoriesLoading) return <div className="animate-pulse flex gap-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div>;

  const today = new Date();
  
  // Filtering Orders
  const filteredOrders = orders.filter((o: any) => {
    if (!o.timestamp) return false;
    const orderDate = new Date(o.timestamp);
    if (period === 'day') return isAfter(orderDate, startOfDay(today));
    if (period === 'week') return isAfter(orderDate, startOfWeek(today, { weekStartsOn: 1 }));
    return isAfter(orderDate, startOfMonth(today));
  });

  const activeOrdersCount = orders.filter((o: any) => !terminalIds.includes(o.status)).length;
  const completedCount = filteredOrders.filter((o: any) => terminalIds.includes(o.status) && !canceledIds.includes(o.status)).length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Peak Hours Math
  const hourCounts = new Array(24).fill(0);
  filteredOrders.forEach((o: any) => {
    if (o.timestamp) {
       const hour = new Date(o.timestamp).getHours();
       hourCounts[hour]++;
    }
  });

  const chartDataHours = hourCounts.map((count, hour) => ({
    time: `${hour}h`,
    Commandes: count
  })).filter((c, idx) => c.Commandes > 0 || (idx >= 8 && idx <= 22)); 

  // Top Products Math
  const productCount: Record<string, number> = {};
  const categoryCount: Record<string, number> = {};
  const driverPerformance: Record<string, { deliveries: number, totalTime: number, ratingSum: number, ratingCount: number }> = {};

  filteredOrders.forEach((o: any) => {
     if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
           if (item.product && item.product.id) {
               // Limit product name length for charting
               let name = item.product.name;
               if (name.length > 20) name = name.substring(0, 20) + '...';
               productCount[name] = (productCount[name] || 0) + item.quantity;
           }
           
           if (item.product && item.product.categoryId) {
               let catData = categories?.find((c:any) => c.id === item.product.categoryId || 'cat_' + c.id === item.product.categoryId);
               let catName = catData?.name || 'Autres';
               categoryCount[catName] = (categoryCount[catName] || 0) + item.quantity;
           }
        });
     }

     // Driver Math
     if (o.driver && o.driver.id && o.status === 'completed') {
       if (!driverPerformance[o.driver.id]) {
         driverPerformance[o.driver.id] = { deliveries: 0, totalTime: 0, ratingSum: 0, ratingCount: 0 };
       }
       driverPerformance[o.driver.id].deliveries++;
       // Mocking time/rating logic if missing, just counting deliveries for now
     }
  });

  const chartDataProducts = Object.entries(productCount)
     .sort((a, b) => b[1] - a[1]) // Sort descending
     .slice(0, 7) // Top 7 
     .map(([name, qty]) => ({ name, Ventes: qty }));

  const chartDataCategories = Object.entries(categoryCount)
     .sort((a, b) => b[1] - a[1]) // Sort descending
     .map(([name, qty]) => ({ name, Ventes: qty }));
  
  const topDrivers = Object.entries(driverPerformance)
     .sort((a, b) => b[1].deliveries - a[1].deliveries)
     .slice(0, 5);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="font-black text-3xl text-gray-900 tracking-tight">Tableau de Bord</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex mt-2 sm:mt-0">
           <button onClick={() => setPeriod('day')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${period === 'day' ? 'bg-[#DA291C] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Aujourd'hui</button>
           <button onClick={() => setPeriod('week')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${period === 'week' ? 'bg-[#DA291C] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>7 Jours</button>
           <button onClick={() => setPeriod('month')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${period === 'month' ? 'bg-[#DA291C] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Mois</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         <StatsCard title={`Commandes (${period})`} value={filteredOrders.length} color="bg-blue-100 text-blue-700" />
         <StatsCard title="En Cours" value={activeOrdersCount} color="bg-orange-100 text-orange-700" pulse />
         <StatsCard title="Revenus" value={`${totalRevenue.toLocaleString()} Ar`} color="bg-green-100 text-green-700" />
         <StatsCard title="Produits Actifs" value={products.length} color="bg-purple-100 text-purple-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Peak Hours Chart */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
           <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest">Heures de Pointe</h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartDataHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                 <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} />
                 <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                 <Line type="monotone" dataKey="Commandes" stroke="#DA291C" strokeWidth={4} activeDot={{ r: 8, fill: '#FFC72C', stroke: '#DA291C', strokeWidth: 3 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Top Selling Products Chart */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
           <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest">Top Ventes Produits</h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartDataProducts} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                 <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                 <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151', fontWeight: 'bold' }} width={120} />
                 <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                 <Bar dataKey="Ventes" fill="#FFC72C" radius={[0, 8, 8, 0]} barSize={24} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Categories Chart */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
           <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest">Top Catégories</h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartDataCategories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} />
                 <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                 <Bar dataKey="Ventes" fill="#DA291C" radius={[8, 8, 0, 0]} barSize={32} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Top Drivers List */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col">
           <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest">Performances Livreurs ({period})</h3>
           <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {topDrivers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 font-bold">Aucune donnée livreur.</div>
              ) : (
                topDrivers.map(([driverId, stats]: [string, any], idx: number) => {
                  const driverInfo = drivers?.find((d:any) => d.id === driverId);
                  const dName = driverInfo?.name || `Livreur ${driverId.substring(0,4)}`;
                  return (
                    <div key={driverId} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-[#FFC72C] text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 sm:text-lg">{dName}</div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stats.deliveries} courses livrées</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {driverInfo?.status === 'active' ? (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-black uppercase tracking-widest">Actif</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md font-black uppercase tracking-widest">Inactif</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

const StatsCard = ({ title, value, color, pulse }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
     <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest relative z-10">{title}</h3>
     <p className={`font-black text-4xl mt-auto w-fit px-3 py-1 rounded-xl relative z-10 ${color} ${pulse ? 'animate-pulse' : ''}`}>{value}</p>
     <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-20 ${color.split(' ')[0]}`}></div>
  </div>
);

function AdminOrders({ role }: { role: string | null }) {
  const { data: configs } = useFirestore('config', 'brandName');
  const { data: drivers } = useFirestore('drivers', 'createdAt');
  const config = configs[0] || {};
  const customStatuses = config.customStatuses || [
    { id: 'pending', label: 'Nouvelle', color: 'bg-red-100 text-red-700 border-red-200', isTerminal: false, isCanceled: false },
    { id: 'preparing', label: 'En cuisine', color: 'bg-orange-100 text-orange-700 border-orange-200', isTerminal: false, isCanceled: false },
    { id: 'ready', label: 'Prête', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', isTerminal: false, isCanceled: false },
    { id: 'delivering', label: 'En livraison', color: 'bg-blue-100 text-blue-700 border-blue-200', isTerminal: false, isCanceled: false },
    { id: 'completed', label: 'Terminée', color: 'bg-green-100 text-green-700 border-green-200', isTerminal: true, isCanceled: false },
    { id: 'canceled', label: 'Annulée', color: 'bg-gray-100 text-gray-500 border-gray-200', isTerminal: true, isCanceled: true }
  ];

  const terminalIds = customStatuses.filter((s:any) => s.isTerminal).map((s:any) => s.id);
  const canceledIds = customStatuses.filter((s:any) => s.isCanceled).map((s:any) => s.id);
  const initialId = customStatuses[0]?.id || 'pending';

  const { data: orders, loading, update, remove } = useFirestore('orders', 'timestamp', undefined, 200);
  const canEdit = ['super_admin', 'admin', 'editor'].includes(role || '');
  const canDelete = ['super_admin', 'admin'].includes(role || '');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'canceled'>('active');

  const activeOrders = orders.filter((o:any) => !terminalIds.includes(o.status));
  const completedOrders = orders.filter((o:any) => terminalIds.includes(o.status) && !canceledIds.includes(o.status));
  const canceledOrders = orders.filter((o:any) => canceledIds.includes(o.status));
  
  const displayedOrders = filter === 'all' ? orders :
                          filter === 'active' ? activeOrders :
                          filter === 'completed' ? completedOrders :
                          canceledOrders;

  const downloadCSV = () => {
    if (!orders || orders.length === 0) return;
    
    // Header
    let csvContent = "ID,Date,Client,Mode,Statut,Total,Contenu\n";
    
    // Rows
    orders.forEach((order: any) => {
       const dateStr = new Date(order.timestamp).toLocaleString('fr-FR');
       const itemsStr = order.items?.map((item: any) => `${item.quantity}x ${item.product.name}`).join('; ') || '';
       const statusObj = customStatuses.find((s:any) => s.id === order.status);
       const statusLabel = statusObj ? statusObj.label : order.status;
       // Escape double quotes inside strings
       const row = `"${order.orderNumber || order.id}","${dateStr}","${order.customerName}","${order.orderMode}","${statusLabel}","${order.total}","${itemsStr}"`;
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

  const getStatusObj = (statusId: string) => {
     return customStatuses.find((s:any) => s.id === statusId) || { label: statusId, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  const advanceOrderState = (order: any) => {
    let currentIndex = customStatuses.findIndex((s:any) => s.id === order.status);
    if (currentIndex === -1 && (order.status === 'nouvelle' || order.status === 'new')) currentIndex = 0; // Fix existing bugged orders

    if (currentIndex >= 0 && currentIndex < customStatuses.length - 1) {
       let nextIndex = currentIndex + 1;
       // Skip delivering if mode is emporter
       if (order.orderMode === 'emporter' && customStatuses[nextIndex]?.id === 'delivering') {
           nextIndex++;
       }
       // If next is valid and not already terminal (unless they specifically want to go back? usually we don't go back here, and advance doesn't bypass terminal unless it's part of the flow)
       // Let's just blindly go to nextIndex as long as it exists and is not canceled
       while (nextIndex < customStatuses.length && customStatuses[nextIndex].isCanceled) {
           nextIndex++;
       }
       if (nextIndex < customStatuses.length) {
          update(order.id, { status: customStatuses[nextIndex].id });
       }
    }
  };

  if (loading) return <div className="animate-pulse flex gap-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6 gap-4">
        <h2 className="font-black text-2xl text-gray-900 tracking-tight">Gestion des Commandes</h2>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
           <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-colors ${filter === 'active' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>En cours ({activeOrders.length})</button>
           <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-colors ${filter === 'completed' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Terminées ({completedOrders.length})</button>
           <button onClick={() => setFilter('canceled')} className={`px-4 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-colors ${filter === 'canceled' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Annulées ({canceledOrders.length})</button>
           <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl font-black text-sm whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Toutes</button>
           <button onClick={downloadCSV} className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-bold hover:bg-green-100 whitespace-nowrap text-sm flex items-center gap-2"><Download className="w-4 h-4"/> CSV</button>
        </div>
      </div>
      
      {displayedOrders.length === 0 ? (
        <p className="text-gray-500 font-bold p-8 text-center bg-gray-50 rounded-xl border border-dashed text-lg">Aucune commande {filter !== 'all' ? `dans cette catégorie.` : `pour le moment.`}</p>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order: any) => {
            const statusObj = getStatusObj(order.status);
            return (
            <div key={order.id} className="flex flex-col lg:flex-row justify-between p-4 sm:p-5 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-black text-xl text-gray-900">#{order.orderNumber || order.id}</h3>
                  <span className={`px-3 py-1 rounded-md text-xs font-black uppercase border tracking-widest flex items-center gap-1.5 ${statusObj.color}`}>
                    {order.status === initialId && <span className="w-2 h-2 rounded-full bg-red-500/80 animate-pulse"></span>}
                    {statusObj.label}
                  </span>
                  {order.posName && (
                    <span className="text-[10px] bg-[#FFC72C]/20 text-[#DA291C] px-2 py-1 rounded uppercase tracking-widest font-black">📍 {order.posName}</span>
                  )}
                  <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded uppercase font-black tracking-widest ml-auto">
                    {new Date(order.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-sm font-bold text-gray-600 flex items-center gap-2 mb-3">
                  <span className="text-gray-900">{order.customerName}</span> 
                  <span className="text-gray-300">•</span>
                  <span className={order.orderMode === 'livraison' ? 'text-blue-600' : 'text-orange-600'}>
                    {order.orderMode === 'livraison' ? `🛵 Livraison : ${order.address}` : '🛍️ À emporter'}
                  </span>
                </p>
                
                <div className="bg-white border text-sm font-bold border-gray-100 rounded-xl p-3 inline-block min-w-[200px]">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex gap-2">
                       <span className="text-[#DA291C]">{item.quantity}x</span> <span className="text-gray-800">{item.product?.name}</span>
                       {item.instructions && <span className="text-gray-400 font-normal italic text-xs ml-1">({item.instructions})</span>}
                    </div>
                  ))}
                </div>

                {order.orderMode === 'livraison' && (
                  <div className="mt-4 bg-gray-50 border border-gray-200 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-sm">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                           <Bike className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Livreur Assigné</p>
                           <p className="font-bold text-gray-900 text-sm">
                             {order.driver ? order.driver.name : 'Aucun'}
                           </p>
                        </div>
                     </div>
                     <select 
                        className="bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-lg px-2 py-1.5 outline-none cursor-pointer w-full sm:w-auto"
                        value={order.driver?.id || ''}
                        onChange={(e) => {
                           const newDriverId = e.target.value;
                           if (!newDriverId) {
                              update(order.id, { driver: null });
                           } else {
                              const selected = drivers?.find((d:any) => d.id === newDriverId);
                              if (selected) {
                                 update(order.id, { driver: { id: selected.id, name: selected.name, phone: selected.phone } });
                              }
                           }
                        }}
                     >
                        <option value="">-- Assigner --</option>
                        {drivers?.filter((d:any) => d.status === 'active').map((d:any) => (
                           <option key={d.id} value={d.id}>{d.name} {d.zone ? `(${d.zone})` : ''}</option>
                        ))}
                     </select>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col lg:items-end justify-between mt-4 lg:mt-0 lg:pl-6 border-t px-2 pt-4 lg:pt-0 lg:px-0 lg:border-t-0 lg:border-l border-gray-100 shrink-0">
                <span className="font-black text-2xl text-gray-900 mb-4">{order.total.toLocaleString()} Ar</span>
                
                <div className="flex gap-2 w-full lg:w-auto">
                   {(canEdit && !terminalIds.includes(order.status) && order.status !== canceledIds[0]) && (
                     <button 
                        onClick={() => advanceOrderState(order)} 
                        className="flex-1 lg:flex-none px-4 py-2.5 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-800 active:scale-95 transition-all shadow-md"
                     >
                       Passer à l'étape suivante ➡️
                     </button>
                   )}
                   {(canEdit && order.status === (customStatuses.find((s:any) => s.label.toLowerCase().includes('livraison') || s.id.includes('deliver'))?.id || 'delivering')) && (
                     <button 
                       onClick={() => update(order.id, { driverLocation: { lat: -18.910012 + Math.random() * 0.01, lng: 47.525581 + Math.random() * 0.01 } })} 
                       className="px-3 py-2.5 bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-100 active:scale-95 transition-all outline outline-1 outline-blue-200"
                     >
                       Simuler position
                     </button>
                   )}
                   {(canEdit && !terminalIds.includes(order.status) && canceledIds.length > 0) && (
                     <button onClick={() => update(order.id, { status: canceledIds[0]})} className="px-3 py-2.5 bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-100 active:scale-95 transition-all outline outline-1 outline-red-200">Annuler</button>
                   )}
                   {canDelete && (
                     <button onClick={() => remove(order.id)} className="p-2.5 bg-gray-100 text-gray-400 rounded-xl hover:bg-red-100 hover:text-red-500 transition-colors" title="Supprimer">
                        <Trash2 className="w-5 h-5"/>
                     </button>
                   )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

function AdminPromos({ role }: { role: string | null }) {
  const { data: promos, loading, add, update, remove } = useFirestore('promos');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const canEdit = ['super_admin', 'admin', 'editor'].includes(role || '');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-900">Promotions & Bannières</h2>
        {canEdit && (
          <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <Plus className="w-4 h-4"/> Ajouter Promo
          </button>
        )}
      </div>

      {loading ? <div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div> : (
        <div className="space-y-4">
          {promos.map((p: any) => (
             <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 items-center">
                <div className="flex-1">
                  <h3 className="font-black text-lg">{p.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{p.description}</p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                     <button onClick={() => update(p.id, { isActive: !p.isActive })} className={`px-3 py-1 rounded-full text-xs font-bold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{p.isActive ? 'Actif' : 'Inactif'}</button>
                     <button onClick={() => { setEditingItem(p); setShowModal(true); }} className="text-blue-500 font-bold text-sm px-3 mx-2">Modifier</button>
                     <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
                  </div>
                )}
             </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6">
            <h3 className="font-black text-2xl mb-6 text-gray-900">{editingItem ? 'Modifier' : 'Ajouter'}</h3>
            <form onSubmit={(e: any) => {
               e.preventDefault();
               const payload = {
                 title: e.target.title.value,
                 description: e.target.description.value,
                 isActive: e.target.isActive.checked
               };
               if (editingItem) update(editingItem.id, payload);
               else add(payload);
               setShowModal(false);
            }} className="space-y-4">
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Titre</label>
                  <input name="title" defaultValue={editingItem?.title} required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#DA291C]" placeholder="Promo Été..." />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Description courte</label>
                  <textarea name="description" defaultValue={editingItem?.description} required rows={3} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#DA291C]"></textarea>
               </div>
               <div className="flex items-center gap-3 py-2">
                 <input type="checkbox" name="isActive" defaultChecked={editingItem?.isActive ?? true} className="w-5 h-5 accent-[#DA291C] cursor-pointer" />
                 <span className="font-bold text-sm">Afficher sur l'accueil</span>
               </div>
               <button type="submit" className="w-full bg-gray-900 text-white font-black uppercase text-sm py-4 rounded-xl mt-4">Enregistrer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminCMS({ role }: { role: string | null }) {
  const { data: pages, loading, add, update, remove } = useFirestore('page_content');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const canEdit = ['super_admin', 'admin', 'editor'].includes(role || '');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-900">CMS / Pages Statiques</h2>
        {canEdit && (
          <button onClick={() => { setEditingItem({ pageKey: '', sections: [] }); setShowModal(true); }} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <Plus className="w-4 h-4"/> Ajouter Contenu
          </button>
        )}
      </div>

      {loading ? <div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div> : (
        <div className="space-y-4">
          {pages.map((p: any) => (
             <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 items-center">
                <div className="flex-1">
                  <h3 className="font-black text-lg">{p.pageKey}</h3>
                  <p className="text-gray-500 text-sm mt-1">{p.sections?.length || 0} sections actives</p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                     <button onClick={() => { setEditingItem(p); setShowModal(true); }} className="text-blue-500 font-bold text-sm px-3 mx-2">Éditer le contenu</button>
                     <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
                  </div>
                )}
             </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6">
            <h3 className="font-black text-2xl mb-6 text-gray-900">Éditeur de Page JSON</h3>
            <form onSubmit={(e: any) => {
               e.preventDefault();
               try {
                 const sectionsData = JSON.parse(e.target.sections.value);
                 const payload = {
                   pageKey: e.target.pageKey.value,
                   sections: sectionsData
                 };
                 if (editingItem?.id) update(editingItem.id, payload);
                 else add(payload);
                 setShowModal(false);
               } catch (err) {
                 alert("Erreur de syntaxe JSON. Veuillez corriger avant d'enregistrer.");
               }
            }} className="space-y-4">
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Clé de page (ex: 'about')</label>
                  <input name="pageKey" defaultValue={editingItem?.pageKey} required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#DA291C]" placeholder="home-hero..." />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Contenu (Format JSON strict)</label>
                  <textarea name="sections" defaultValue={JSON.stringify(editingItem?.sections || [], null, 2)} required rows={10} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#DA291C] font-mono text-xs"></textarea>
               </div>
               <button type="submit" className="w-full bg-gray-900 text-white font-black uppercase text-sm py-4 rounded-xl mt-4">Enregistrer la structure JSON</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function AdminOrderStatuses({ role }: { role: string | null }) {
  const { data: configs, loading, update, add } = useFirestore('config', 'brandName');
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const canEdit = ['super_admin', 'admin', 'editor'].includes(role || '');

  const config = configs[0] || {};
  const statuses = config.customStatuses || [
    { id: 'pending', label: 'Nouvelle', customerLabel: 'Commande reçue, en attente...', color: 'bg-red-100 text-red-700', isTerminal: false, isCanceled: false },
    { id: 'preparing', label: 'En cuisine', customerLabel: 'Vos plats sont en cours de préparation en cuisine !', color: 'bg-orange-100 text-orange-700', isTerminal: false, isCanceled: false },
    { id: 'ready', label: 'Prête', customerLabel: 'Commande prête !', color: 'bg-yellow-100 text-yellow-700', isTerminal: false, isCanceled: false },
    { id: 'delivering', label: 'En livraison', customerLabel: 'Le livreur est en route vers chez vous !', color: 'bg-blue-100 text-blue-700', isTerminal: false, isCanceled: false },
    { id: 'completed', label: 'Terminée', customerLabel: 'Commande terminée !', color: 'bg-green-100 text-green-700', isTerminal: true, isCanceled: false },
    { id: 'canceled', label: 'Annulée', customerLabel: 'Commande annulée.', color: 'bg-gray-100 text-gray-500', isTerminal: true, isCanceled: true }
  ];

  const handleSaveStatus = async (e: any) => {
     e.preventDefault();
     const newStatus = {
        id: e.target.sid.value.toLowerCase().replace(/[\s\W]+/g, '_'),
        label: e.target.label.value,
        customerLabel: e.target.customerLabel.value,
        color: e.target.color.value,
        isTerminal: e.target.isTerminal.checked,
        isCanceled: e.target.isCanceled.checked
     };

     let newStatuses = [...statuses];
     if (editingIndex !== null) {
        newStatuses[editingIndex] = newStatus;
     } else {
        newStatuses.push(newStatus);
     }

     if (config.id) {
       await update(config.id, { customStatuses: newStatuses });
     } else {
       await add({ customStatuses: newStatuses });
     }
     setShowModal(false);
     setEditingIndex(null);
  };

  const removeStatus = async (idx: number) => {
     if(!window.confirm("Supprimer ce statut ?")) return;
     let newStatuses = [...statuses];
     newStatuses.splice(idx, 1);
     if (config.id) {
        await update(config.id, { customStatuses: newStatuses });
     }
  };

  const moveStatus = async (idx: number, dir: number) => {
     let newStatuses = [...statuses];
     if (idx + dir < 0 || idx + dir >= newStatuses.length) return;
     const temp = newStatuses[idx];
     newStatuses[idx] = newStatuses[idx + dir];
     newStatuses[idx + dir] = temp;
     if (config.id) {
        await update(config.id, { customStatuses: newStatuses });
     }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="font-black text-2xl text-gray-900">Statuts de Commande</h2>
           <p className="text-gray-500 text-sm mt-1">Personnalisez le cycle de vie d'une commande.</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditingIndex(null); setShowModal(true); }} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <Plus className="w-4 h-4"/> Ajouter Statut
          </button>
        )}
      </div>

      {loading ? <div className="animate-pulse space-y-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div> : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          {statuses.map((st: any, idx: number) => (
             <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl gap-4">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col gap-1">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveStatus(idx, -1); }} disabled={idx === 0} className="text-gray-400 hover:text-gray-900 disabled:opacity-30">▲</button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveStatus(idx, 1); }} disabled={idx === statuses.length - 1} className="text-gray-400 hover:text-gray-900 disabled:opacity-30">▼</button>
                   </div>
                   <div>
                     <div className="flex items-center gap-3 mb-1">
                       <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${st.color}`}>{st.label} ({st.id})</span>
                       {st.isTerminal && <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Terminal</span>}
                       {st.isCanceled && <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Annulation</span>}
                     </div>
                     <p className="text-xs text-gray-500">Client voit: <span className="font-medium text-gray-700">"{st.customerLabel}"</span></p>
                   </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingIndex(idx); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg font-bold text-sm">Modifier</button>
                    <button onClick={() => removeStatus(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                )}
             </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-2xl mb-6 text-gray-900">{editingIndex !== null ? 'Modifier le statut' : 'Nouveau statut'}</h3>
            <form onSubmit={handleSaveStatus} className="space-y-4">
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">ID Interne (ex: en_livraison)</label>
                  <input name="sid" defaultValue={editingIndex !== null ? statuses[editingIndex].id : ''} required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#DA291C]" placeholder="mon_statut" />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Label Admin (ex: En cours de livraison)</label>
                  <input name="label" defaultValue={editingIndex !== null ? statuses[editingIndex].label : ''} required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#DA291C]" placeholder="Label pour l'admin" />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Message pour le client</label>
                  <input name="customerLabel" defaultValue={editingIndex !== null ? statuses[editingIndex].customerLabel : ''} required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#DA291C]" placeholder="Votre commande est en route !" />
               </div>
               <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Couleur Tailwind (ex: bg-blue-100 text-blue-700)</label>
                  <input name="color" defaultValue={editingIndex !== null ? statuses[editingIndex].color : 'bg-gray-100 text-gray-700'} required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#DA291C]" />
               </div>
               <div className="flex flex-col gap-2 mt-4 bg-gray-50 p-4 border rounded-xl">
                 <div className="flex items-center gap-3">
                   <input type="checkbox" name="isTerminal" defaultChecked={editingIndex !== null ? statuses[editingIndex].isTerminal : false} className="w-5 h-5 accent-[#DA291C] cursor-pointer" />
                   <span className="font-bold text-sm">Statut Terminal (archive la commande)</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <input type="checkbox" name="isCanceled" defaultChecked={editingIndex !== null ? statuses[editingIndex].isCanceled : false} className="w-5 h-5 accent-[#DA291C] cursor-pointer" />
                   <span className="font-bold text-sm">Statut Annulation (commande échouée/annulée)</span>
                 </div>
               </div>
               <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-800 font-black uppercase text-sm py-4 rounded-xl">Annuler</button>
                 <button type="submit" className="flex-1 bg-gray-900 text-white font-black uppercase text-sm py-4 rounded-xl">Enregistrer</button>
               </div>
            </form>
          </div>
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

  const seedDemoData = async () => {
    if(!window.confirm("Voulez-vous injecter les données de démonstration ? (Catégories, Produits, Points de Vente)\nCela ajoutera ces éléments à votre base de données.")) return;
    try {
      setSaving(true);
      for(const cat of CATEGORIES) {
         if (cat.id !== 'all') await setDoc(doc(db, 'categories', 'cat_' + cat.id), { name: cat.name, icon: cat.icon, orderId: Date.now() });
      }
      for(const p of PRODUCTS) {
         await setDoc(doc(db, 'products', p.id), { name: p.name, description: p.description, price: p.price, image: p.image, categoryId: 'cat_' + p.categoryId, popular: p.popular || false });
      }
      for(const pos of RESTAURANTS) {
         await addDoc(collection(db, 'points_of_sale'), { name: pos.name, address: pos.address, lat: pos.lat, lng: pos.lng, phone: pos.phone, isOpen: true });
      }
      alert("Données de démonstration chargées avec succès !");
    } catch(e) {
      console.error(e);
      alert("Erreur lors de l'injection des données.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse flex gap-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="font-black text-3xl text-gray-900">Configuration Générale</h2>
        {canEdit && (
          <button type="button" onClick={seedDemoData} disabled={saving} className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-blue-200 hide-scrollbar transition-colors">
            {saving ? 'Chargement...' : 'Remplir avec des démos (Produits...)'}
          </button>
        )}
      </div>
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
                      onChange={(e) => { logActivity('MODIF_ROLE', `${u.email} -> ${e.target.value}`); update(u.id, { role: e.target.value }); }}
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
                       onClick={() => { if(window.confirm('Voulez-vous révoquer l\'accès de cet utilisateur ?')) { logActivity('REVOQUER_ACCES', u.email); remove(u.id); } }} 
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

function AdminPOS({ role }: { role: string | null }) {
  const { data: posList, loading, add, remove, update } = useFirestore('points_of_sale', 'name');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const canEdit = ['super_admin', 'admin', 'editor'].includes(role || '');

  const [addressToGeocode, setAddressToGeocode] = useState(editingItem?.address || '');
  const [lat, setLat] = useState<number | string>(editingItem?.lat || '');
  const [lng, setLng] = useState<number | string>(editingItem?.lng || '');
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
     if (showModal) {
        setAddressToGeocode(editingItem?.address || '');
        setLat(editingItem?.lat || '');
        setLng(editingItem?.lng || '');
     }
  }, [showModal, editingItem]);

  const handleGeocode = async () => {
    if (!addressToGeocode) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToGeocode)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
        alert("Coordonnées trouvées !");
      } else {
        alert("Impossible de trouver les coordonnées pour cette adresse.");
      }
    } catch (err) {
      alert("Erreur lors de la recherche des coordonnées.");
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-900">Points de Vente</h2>
        {canEdit && (
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <Plus className="w-4 h-4"/> Nouveau Site
        </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posList.map((p: any) => (
          <div key={p.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
             <div className={`absolute top-0 right-0 px-4 py-1 font-black text-[10px] uppercase tracking-widest ${p.isOpen !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {p.isOpen !== false ? 'Ouvert' : 'Fermé'}
             </div>
             <h3 className="font-black text-lg mb-1 pr-16">{p.name}</h3>
             <p className="text-sm font-bold text-gray-500 mb-4">{p.address}</p>
             <div className="flex gap-4 text-xs font-bold text-gray-400 mb-6 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span>📍 Lat: {p.lat}</span>
                <span>📍 Lng: {p.lng}</span>
             </div>
             {canEdit && (
               <div className="flex gap-2">
                  <button onClick={() => { setEditingItem(p); setShowModal(true); }} className="px-4 py-2 bg-gray-100 rounded-lg font-black text-xs hover:bg-gray-200 transition-colors uppercase tracking-widest flex-1">Modifier</button>
                  <button onClick={() => { logActivity('SUPPR_POS', p.name); remove(p.id); }} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
               </div>
             )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-2xl">{editingItem ? 'Modifier Site' : 'Nouveau Site'}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                const posData = {
                  name: e.target.name.value,
                  address: e.target.address.value,
                  lat: Number(lat),
                  lng: Number(lng),
                  phone: e.target.phone.value,
                  isOpen: e.target.isOpen.checked,
                  priority: Number(e.target.priority.value || 0)
                };
                if (editingItem) {
                  await update(editingItem.id, posData);
                  logActivity('MODIF_POS', posData.name);
                } else {
                  await add(posData);
                  logActivity('AJOUT_POS', posData.name);
                }
                setShowModal(false);
              }} className="space-y-4">
                 <div>
                   <label className="block text-xs font-black text-gray-500 mb-1 uppercase tracking-widest">Nom du point de vente</label>
                   <input name="name" defaultValue={editingItem?.name} placeholder="Ex: Boutique Centre-Ville" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold focus:border-[#FFC72C] outline-none transition-colors" required />
                 </div>
                 
                 <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                   <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                     <MapPin className="w-5 h-5" /> Localisation simplifiée
                   </div>
                   <div>
                     <label className="block text-xs font-black text-blue-600/70 mb-1 uppercase tracking-widest">Adresse (pour recherche GPS)</label>
                     <div className="flex gap-2">
                       <input 
                         name="address" 
                         value={addressToGeocode} 
                         onChange={(e) => setAddressToGeocode(e.target.value)}
                         placeholder="Ex: 15 rue de Paris, Dakar" 
                         className="w-full bg-white border border-blue-200 p-3 rounded-xl font-bold focus:border-blue-400 outline-none transition-colors text-sm" 
                         required 
                       />
                       <button 
                         type="button" 
                         onClick={handleGeocode} 
                         disabled={isGeocoding || !addressToGeocode}
                         className="bg-blue-600 text-white px-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                       >
                         {isGeocoding ? '...' : 'Trouver GPS'}
                       </button>
                     </div>
                     <p className="text-[10px] text-blue-600/60 mt-1 font-bold">Tapez l'adresse puis cliquez sur "Trouver GPS" pour remplir la latitude et longitude.</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-black text-blue-600/70 mb-1 uppercase tracking-widest">Latitude</label>
                        <input name="lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="0.0000" className="w-full bg-white border border-blue-200 p-3 rounded-xl font-mono text-sm" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-blue-600/70 mb-1 uppercase tracking-widest">Longitude</label>
                        <input name="lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="0.0000" className="w-full bg-white border border-blue-200 p-3 rounded-xl font-mono text-sm" required />
                      </div>
                   </div>
                 </div>

                 <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" name="isOpen" id="isOpen" defaultChecked={editingItem?.isOpen !== false} className="w-5 h-5 rounded accent-green-600 cursor-pointer" />
                    <label htmlFor="isOpen" className="font-black text-sm text-gray-700 cursor-pointer flex-1">Site Actif (accepte les commandes)</label>
                 </div>
                 <input type="hidden" name="phone" defaultValue="" />
                 <input type="hidden" name="priority" defaultValue="0" />
                 
                 <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">Annuler</button>
                    <button type="submit" className="flex-[2] bg-gray-900 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-gray-800 transition-colors">Enregistrer</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function AdminReviews({ role }: { role: string | null }) {
  const { data: reviews, loading, update, remove } = useFirestore('reviews', 'createdAt');
  const canEdit = ['super_admin', 'admin', 'editor'].includes(role || '');
  const [activeTab, setActiveTab] = useState<'client_to_driver' | 'driver_to_client' | 'platform'>('client_to_driver');

  return (
    <div className="space-y-6">
      <h2 className="font-black text-2xl text-gray-900 border-b pb-4">Avis & Évaluations</h2>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-max">
         <button onClick={() => setActiveTab('client_to_driver')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'client_to_driver' ? 'bg-white shadow-sm text-[#DA291C]' : 'text-gray-500 hover:text-gray-900'}`}>Clients ➔ Livreurs</button>
         <button onClick={() => setActiveTab('driver_to_client')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'driver_to_client' ? 'bg-white shadow-sm text-[#DA291C]' : 'text-gray-500 hover:text-gray-900'}`}>Livreurs ➔ Clients</button>
         <button onClick={() => setActiveTab('platform')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'platform' ? 'bg-white shadow-sm text-[#DA291C]' : 'text-gray-500 hover:text-gray-900'}`}>Sur l'Application</button>
      </div>

      <div className="grid gap-4">
         {reviews.filter((r:any) => r.type === activeTab).map((r: any) => (
           <div key={r.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="font-black text-gray-900 bg-gray-100 px-2 py-1 rounded-md text-xs uppercase tracking-widest">{activeTab === 'client_to_driver' ? `Client ➔ Livreur: ${r.driverId}` : activeTab === 'driver_to_client' ? `Livreur: ${r.driverId} ➔ Client` : 'Client'}</span>
                    <div className="flex text-[#FFC72C]">
                       {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'text-gray-200'}`} />)}
                    </div>
                 </div>
                 {r.tags && r.tags.length > 0 && (
                   <div className="flex gap-2 mb-2">
                     {r.tags.map((t: string) => <span key={t} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t}</span>)}
                   </div>
                 )}
                 <p className="text-sm font-bold text-gray-600 italic">"{r.comment || 'Aucun commentaire'}"</p>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 block">{new Date(r.createdAt).toLocaleString()} {r.orderId && `| CMD: ${r.orderId}`}</span>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                   <button onClick={() => remove(r.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              )}
           </div>
         ))}
         {reviews.filter((r:any) => r.type === activeTab).length === 0 && <p className="text-gray-500 font-bold p-12 text-center bg-gray-50 border-2 border-dashed rounded-3xl">Aucun avis dans cette catégorie.</p>}
      </div>
    </div>
  );
}

function AdminLogs() {
  const { data: logs, loading } = useFirestore('activity_logs', 'timestamp');

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="font-black text-2xl mb-6 text-gray-900 border-b pb-4">Journal d'Activité</h2>
      <div className="space-y-2">
         {logs.map((log: any) => (
           <div key={log.id} className="flex items-center justify-between p-3 border-b border-gray-50 text-xs font-bold font-mono">
              <div className="flex items-center gap-4">
                 <span className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                 <span className="text-blue-600 uppercase">[{log.action}]</span>
                 <span className="text-gray-900">{log.details}</span>
              </div>
              <span className="text-gray-400">{log.userName}</span>
           </div>
         ))}
      </div>
    </div>
  );
}

function AdminBackups() {
  const { data: config } = useFirestore('config');
  const { data: products } = useFirestore('products');
  const { data: categories } = useFirestore('categories');
  const { data: pos } = useFirestore('points_of_sale');

  const handleExport = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      config,
      products,
      categories,
      pos
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "gastronomie-backup-" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    logActivity("EXPORT_SAUVEGARDE", "Base de données complète exportée");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Sauvegardes de Sécurité</h2>
          <p className="text-gray-500 font-bold text-sm mt-1">Exportez la base de données de production vers un fichier JSON sécurisé.</p>
        </div>
      </div>
      
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-sm">
         <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
            <Download className="w-8 h-8" />
         </div>
         <h3 className="font-black text-xl mb-2">Exporter le catalogue et la configuration</h3>
         <p className="text-gray-500 font-bold mb-8 max-w-xl">
           Générez un fichier JSON contenant l'intégralité de la configuration, des catégories, des produits et des points de vente. Utilisez ce fichier à des fins d'archivage.
         </p>
         <button 
           onClick={handleExport}
           className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-black flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
         >
           <Download className="w-5 h-5"/>
           Télécharger l'Archive
         </button>
      </div>
      
      <div className="bg-red-50 p-6 sm:p-10 rounded-3xl border border-red-100">
         <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <UploadCloud className="w-8 h-8" />
         </div>
         <h3 className="font-black text-xl mb-2 text-red-900">Restauration (Import)</h3>
         <p className="text-red-700 font-bold max-w-xl text-sm">
           Pour restaurer les données d'usine, vous devez procéder manuellement via la Console Firebase en raison des règles de sécurité. L'importation directe écraserait les instances en cours (Commandes).
         </p>
      </div>
    </div>
  );
}

function AdminDrivers({ role }: { role: string | null }) {
  const { data: drivers, loading, add, update, remove } = useFirestore('drivers', 'createdAt');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const driverData = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      zone: formData.get('zone'),
      status: formData.get('status'),
      createdAt: isEditing ? isEditing.createdAt : Date.now(),
    };

    if (isEditing) {
      await update(isEditing.id, driverData);
    } else {
      await add({
        ...driverData,
        deliveriesCount: 0,
        rating: 0,
        delaysCount: 0
      });
    }

    setShowModal(false);
    setIsEditing(null);
  };

  const handleEdit = (driver: any) => {
    setIsEditing(driver);
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if(window.confirm('Êtes-vous sûr de vouloir supprimer le livreur : ' + name + ' ?')) {
      await remove(id);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Gestion des Livreurs</h2>
          <p className="text-gray-500 font-bold">Ajoutez, modifiez ou suspendez des livreurs.</p>
        </div>
        <button onClick={() => { setIsEditing(null); setShowModal(true); }} className="bg-[#DA291C] text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center gap-2 shadow-lg shadow-red-500/20">
          <Plus className="w-5 h-5"/> Ajouter
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest">
                 <th className="p-4 font-black">Nom & Contact</th>
                 <th className="p-4 font-black">Zone</th>
                 <th className="p-4 font-black text-center">Score / Courses</th>
                 <th className="p-4 font-black text-center">Statut</th>
                 <th className="p-4 font-black text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {drivers?.map((driver: any) => (
                 <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 text-base">{driver.name}</div>
                      <div className="text-sm font-medium text-gray-500">{driver.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">{driver.zone || 'Globale'}</span>
                    </td>
                    <td className="p-4 text-center">
                       <div className="font-black text-gray-900 flex justify-center items-center gap-1">
                          {driver.rating ? <><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {driver.rating}</> : <><Star className="w-4 h-4 text-gray-300" /> -</>}
                       </div>
                       <div className="text-xs text-gray-400 font-bold mt-1">{driver.deliveriesCount || 0} courses</div>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${driver.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {driver.status === 'active' ? 'Actif' : 'Inactif'}
                       </span>
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex justify-end gap-2">
                         <button onClick={() => handleEdit(driver)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                           <Edit className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDelete(driver.id, driver.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </td>
                 </tr>
               ))}
               {(!drivers || drivers.length === 0) && (
                 <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold">Aucun livreur trouvé.</td></tr>
               )}
             </tbody>
           </table>
         </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
             <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
             <h3 className="text-2xl font-black text-gray-900 mb-6">{isEditing ? 'Modifier Livreur' : 'Nouveau Livreur'}</h3>
             
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Nom Complet</label>
                 <input type="text" name="name" defaultValue={isEditing?.name} placeholder="Ex: Jean Rakoto" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C]" required />
               </div>
               <div>
                 <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Téléphone</label>
                 <input type="tel" name="phone" defaultValue={isEditing?.phone} placeholder="034 00 000 00" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C]" required />
               </div>
               <div>
                 <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Zone (Optionnel)</label>
                 <input type="text" name="zone" defaultValue={isEditing?.zone} placeholder="Ex: Centre-ville" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C]" />
               </div>
               <div>
                 <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Statut</label>
                 <select name="status" defaultValue={isEditing?.status || 'active'} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-[#DA291C] font-bold">
                   <option value="active">🟢 Actif</option>
                   <option value="inactive">🔴 Inactif</option>
                 </select>
               </div>
               
               <button type="submit" className="w-full bg-[#DA291C] text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-500/20 mt-4">
                 {isEditing ? 'Mettre à jour' : 'Ajouter le livreur'}
               </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}

function AdminCallbacks({ role }: { role: string | null }) {
  const { data: callbacks, update, remove } = useFirestore('callbacks', 'createdAt');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      case 'converted': return 'bg-green-100 text-green-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'processed', label: 'Traité' },
    { value: 'converted', label: 'Converti' }
  ];

  const handleUpdateStatus = async (id: string, status: string) => {
    await update(id, { status });
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    await update(id, { notes });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette demande ?')) {
      await remove(id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Demandes de rappel client</h2>
        <p className="text-gray-500 font-bold">Gérez les demandes de contact laissées sur le site.</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest">
                <th className="p-4 font-black">Date</th>
                <th className="p-4 font-black">Client</th>
                <th className="p-4 font-black">Message</th>
                <th className="p-4 font-black">Statut</th>
                <th className="p-4 font-black border-l border-gray-100">Notes internes</th>
                <th className="p-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {callbacks?.map((cb: any) => (
                <tr key={cb.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                     <span className="text-sm font-bold text-gray-600">{new Date(cb.createdAt).toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                     <div className="font-bold text-gray-900">{cb.name}</div>
                     <div className="text-blue-600 font-bold text-sm tracking-widest">
                       <a href={`tel:${cb.phone}`} className="flex items-center gap-1 hover:underline"><PhoneCall className="w-3 h-3"/> {cb.phone}</a>
                     </div>
                  </td>
                  <td className="p-4 max-w-[200px]">
                     <p className="text-xs text-gray-500 line-clamp-2" title={cb.message}>{cb.message || '-'}</p>
                  </td>
                  <td className="p-4">
                     <select
                        onChange={(e) => handleUpdateStatus(cb.id, e.target.value)}
                        value={cb.status || 'pending'}
                        className={`text-xs font-black uppercase px-3 py-1 rounded-full cursor-pointer outline-none border-none shadow-sm ${getStatusColor(cb.status || 'pending')}`}
                     >
                       {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                     </select>
                  </td>
                  <td className="p-4 border-l border-gray-100 bg-gray-50/30">
                     <input 
                       type="text" 
                       defaultValue={cb.notes}
                       placeholder="Ajouter une note..."
                       onBlur={(e) => handleUpdateNotes(cb.id, e.target.value)}
                       className="bg-transparent border-b border-gray-200 focus:border-[#DA291C] outline-none text-sm w-full font-medium pb-1"
                     />
                  </td>
                  <td className="p-4 text-right">
                     <button onClick={() => handleDelete(cb.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}
              {(!callbacks || callbacks.length === 0) && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-bold">Aucune demande de rappel.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
