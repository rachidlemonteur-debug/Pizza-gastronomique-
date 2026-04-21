import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart, Settings, ShoppingBag, List, Users, 
  LogOut, Plus, Trash2, Edit, Save, X, Eye, 
  ArrowLeft, Bell, Search, Menu as MenuIcon, Lock
} from 'lucide-react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { useFirestore } from './hooks/useFirestore';

export default function AdminApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
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

  const navItems = [
    { name: 'Tableau de bord', path: '/admin', icon: <BarChart className="w-5 h-5"/> },
    { name: 'Commandes', path: '/admin/orders', icon: <ShoppingBag className="w-5 h-5"/> },
    { name: 'Produits', path: '/admin/products', icon: <List className="w-5 h-5"/> },
    { name: 'Catégories', path: '/admin/categories', icon: <List className="w-5 h-5"/> },
    { name: 'Configuration', path: '/admin/config', icon: <Settings className="w-5 h-5"/> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className={`bg-gray-900 border-r border-gray-800 text-white w-64 shadow-xl shrink-0 hidden md:flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full z-50'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="font-black text-xl uppercase tracking-tighter text-[#FFC72C]">Super Admin</h2>
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
              <div className="bg-gray-100 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hidden sm:flex">
                 <Search className="w-4 h-4 text-gray-400"/>
                 <input type="text" placeholder="Recherche rapide..." className="bg-transparent border-none outline-none text-sm font-bold w-48"/>
              </div>
              <div className="text-sm font-bold text-gray-600 border-r border-gray-200 pr-4">{user.email}</div>
              <button className="p-2.5 bg-gray-100 rounded-xl relative hover:bg-gray-200 transition-colors">
                 <Bell className="w-5 h-5 text-gray-700"/>
              </button>
           </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
           <Routes>
             <Route path="/" element={<Dashboard />} />
             <Route path="/orders" element={<AdminOrders />} />
             <Route path="/products" element={<AdminProducts />} />
             <Route path="/categories" element={<AdminCategories />} />
             <Route path="/config" element={<AdminConfig />} />
           </Routes>
        </main>
      </div>
    </div>
  );
}

function AdminProducts() {
  const { data: products, loading, add, remove, update } = useFirestore('products', 'name');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleEdit = (product: any) => {
    setEditingItem(product);
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-900">Produits</h2>
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700">
          <Plus className="w-4 h-4"/> Ajouter
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4"><div className="w-full h-12 bg-gray-200 rounded-xl"></div><div className="w-full h-12 bg-gray-200 rounded-xl"></div></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold flex items-center gap-3">
                    <img src={p.image || 'https://placehold.co/100x100?text=No+Image'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100"/>
                    {p.name}
                  </td>
                  <td className="px-6 py-4 font-black text-[#DA291C]">{p.price} Ar</td>
                  <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold text-xs">{p.categoryId}</span></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2 font-bold text-sm">Modifier</button>
                    <button onClick={() => remove(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500 font-bold">Aucun produit configuré.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <h3 className="font-black text-xl mb-4">{editingItem ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                await (editingItem ? update(editingItem.id, {
                  name: e.target.name.value,
                  price: Number(e.target.price.value),
                  image: e.target.image.value || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
                  description: e.target.description.value,
                  categoryId: e.target.category.value,
                  popular: e.target.popular.checked
                }) : add({
                  name: e.target.name.value,
                  price: Number(e.target.price.value),
                  image: e.target.image.value || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
                  description: e.target.description.value,
                  categoryId: e.target.category.value,
                  popular: e.target.popular?.checked || false
                }));
                setShowModal(false);
                setEditingItem(null);
              }} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Nom</label>
                   <input name="name" defaultValue={editingItem?.name} className="w-full bg-gray-50 border p-2 rounded-xl" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">Prix (Ar)</label>
                     <input type="number" name="price" defaultValue={editingItem?.price} className="w-full bg-gray-50 border p-2 rounded-xl" required />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">Catégorie ID</label>
                     <input name="category" placeholder="ex: 1" defaultValue={editingItem?.categoryId} className="w-full bg-gray-50 border p-2 rounded-xl" required />
                   </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">URL Image</label>
                   <input name="image" placeholder="https://..." defaultValue={editingItem?.image} className="w-full bg-gray-50 border p-2 rounded-xl" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                   <textarea name="description" defaultValue={editingItem?.description} className="w-full bg-gray-50 border p-2 rounded-xl" rows={3}></textarea>
                 </div>
                 <div className="flex items-center gap-2">
                   <input type="checkbox" name="popular" id="popular" defaultChecked={editingItem?.popular} className="w-4 h-4 rounded" />
                   <label htmlFor="popular" className="text-sm font-bold">Populaire (Affiché sur l'accueil)</label>
                 </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Annuler</button>
                    <button type="submit" className="px-4 py-2 bg-[#DA291C] text-white font-bold rounded-xl shadow-md">Enregistrer</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function AdminCategories() {
  const { data: categories, loading, add, remove, update } = useFirestore('categories', 'orderId');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleEdit = (category: any) => {
    setEditingItem(category);
    setShowModal(true);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-900">Catégories</h2>
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-[#DA291C] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700">
          <Plus className="w-4 h-4"/> Ajouter
        </button>
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
              <div className="flex gap-2">
                <button onClick={() => handleEdit(c)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg text-sm font-bold">Modifier</button>
                <button onClick={() => remove(c.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
              </div>
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-20 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="w-16 h-16 bg-[#FFC72C] rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner border-[3px] border-white ring-4 ring-yellow-50">
           <Lock className="w-8 h-8 text-[#DA291C]" />
        </div>
        <h1 className="text-2xl font-black text-center uppercase tracking-tight text-gray-900 mb-2">Accès Sécurisé</h1>
        <p className="text-center text-gray-500 font-bold text-sm mb-8">Espace réservé à l'administration du site</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-6 text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-2">Adresse Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#DA291C] focus:ring-2 focus:ring-red-100 font-bold transition-all" required />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-2">Mot de Passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#DA291C] focus:ring-2 focus:ring-red-100 font-bold transition-all" required />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-[#DA291C] text-white py-3.5 rounded-xl font-black uppercase tracking-wider shadow-[0_10px_20px_rgba(218,41,28,0.3)] hover:bg-red-700 transition-colors mt-2 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-1">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
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

function AdminOrders() {
  const { data: orders, loading, update, remove } = useFirestore('orders', 'timestamp'); // We sort by timestamp theoretically, useFirestore handles default fallback to no order if missing

  if (loading) return <div className="animate-pulse flex gap-4"><div className="w-full h-16 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="font-black text-2xl mb-6 text-gray-900 border-b pb-4">Commandes Récentes</h2>
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
                <div className="flex gap-2">
                   {order.status === 'en_route' ? (
                     <button onClick={() => update(order.id, { status: 'livree' })} className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-lg hover:bg-green-200" title="Marquer comme Livrée">Terminer</button>
                   ) : (
                     <button onClick={() => update(order.id, { status: 'en_route' })} className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-200" title="Marquer en Route">Restaurer</button>
                   )}
                   <button onClick={() => remove(order.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="Supprimer">
                      <Trash2 className="w-4 h-4"/>
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function AdminConfig() {
  const { data: configs, loading, update, add } = useFirestore('config', 'brandName');
  const [saving, setSaving] = useState(false);

  // Default structure if missing
  const config = configs[0] || {
    id: 'main',
    brandName: 'Gastro',
    heroTitle1: 'Méga',
    heroTitle2: 'Gastro.',
    heroSubtitle: 'Le burger le plus attendu de l\'année. Double viande, double fromage fondu. Ça va être énorme.',
    whatsappNumber: '261320735026',
    deliveryFee: 5000
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
      deliveryFee: Number(e.target.deliveryFee.value)
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
    <div className="max-w-2xl bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="font-black text-2xl text-gray-900 mb-6">Configuration Générale</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
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
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">N° WhatsApp Complet</label>
             <input name="whatsappNumber" defaultValue={config.whatsappNumber} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-mono" placeholder="26132000000" required />
           </div>
           <div>
             <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Frais de livraison (Ar)</label>
             <input type="number" name="deliveryFee" defaultValue={config.deliveryFee || 0} className="w-full bg-gray-50 border p-3 rounded-xl font-bold font-mono" required />
           </div>
         </div>
         <button disabled={saving} type="submit" className="w-full bg-[#DA291C] text-white py-4 rounded-xl font-black shadow-md hover:bg-red-700 disabled:opacity-50 flex justify-center items-center gap-2">
            <Save className="w-5 h-5"/> {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
         </button>
      </form>
    </div>
  );
}
