import React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAdmin } from './AdminContext';
import { LayoutDashboard, ShoppingBag, List, Users, Bike, Settings, Store, Menu, LogOut, Eye, Filter, Clock } from 'lucide-react';
import Dashboard from './Dashboard';
import Orders from './Orders';
import Products from './Products';
import Drivers from './Drivers';
import POSManager from './POSManager';
import AdminSettings from './Settings';
import UsersAdmin from './Users';
import Reservations from './Reservations';
import Categories from './Categories';
import Callbacks from './Callbacks';

// Helpers
export const hasPermission = (userRole: string | null, required: string) => {
  if (!userRole) return false;
  if (['super_admin', 'admin'].includes(userRole)) return true;
  if (userRole === 'manager') return ['orders', 'products', 'drivers', 'pos_staff', 'dashboard'].includes(required);
  if (userRole === 'staff') return ['orders', 'dashboard'].includes(required);
  if (userRole === 'driver') return ['driver_panel'].includes(required);
  return false;
};

export default function AdminLayout() {
  const { user, role, loadingAuth, logout, selectedPosId, setSelectedPosId, posList, activePOS } = useAdmin();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-[#FFC72C] border-t-[#DA291C] rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  if (role === 'viewer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
           <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
           </div>
           <h2 className="text-2xl font-black text-gray-900 mb-2">En attente d'approbation</h2>
           <p className="text-gray-500 font-medium mb-6">Votre compte professionnel a été créé avec succès. Veuillez attendre qu'un administrateur valide vos accès avant de pouvoir utiliser l'espace Staff.</p>
           <button onClick={logout} className="bg-gray-100 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors w-full">Déconnexion</button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5"/>, permission: 'dashboard' },
    { name: 'Commandes', path: '/admin/orders', icon: <ShoppingBag className="w-5 h-5"/>, permission: 'orders' },
    { name: 'Points de Vente', path: '/admin/pos', icon: <Store className="w-5 h-5"/>, permission: 'manage_system' },
    { name: 'Catégories', path: '/admin/categories', icon: <List className="w-5 h-5"/>, permission: 'products' },
    { name: 'Produits', path: '/admin/products', icon: <List className="w-5 h-5"/>, permission: 'products' },
    { name: 'Livreurs', path: '/admin/drivers', icon: <Bike className="w-5 h-5"/>, permission: 'drivers' },
    { name: 'Utilisateurs', path: '/admin/users', icon: <Users className="w-5 h-5"/>, permission: 'manage_system' },
    { name: 'Réservations', path: '/admin/reservations', icon: <Clock className="w-5 h-5"/>, permission: 'orders' },
    { name: 'Rappels', path: '/admin/callbacks', icon: <Clock className="w-5 h-5"/>, permission: 'orders' },
    { name: 'Paramètres', path: '/admin/settings', icon: <Settings className="w-5 h-5"/>, permission: 'manage_system' },
  ].filter(item => hasPermission(role, item.permission));

  const roleText: any = {
    super_admin: 'Super Administrateur',
    admin: 'Administrateur',
    manager: 'Manager (POS)',
    staff: 'Employé',
    driver: 'Livreur',
    editor: 'Editeur',
    viewer: 'Spectateur'
  };

  const isGlobalAdmin = ['super_admin', 'admin'].includes(role || '');

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 w-64 shrink-0 hidden md:flex flex-col transition-all duration-300 shadow-sm ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full z-50'}`}>
        <div className="p-6 border-b border-gray-100 flex flex-col justify-start">
          <h2 className="font-black text-2xl tracking-tighter text-gray-900">La Gastro <span className="text-[#DA291C]">HQ</span></h2>
          <span className="text-xs font-bold text-gray-500 uppercase mt-1">{roleText[role!] || 'Staff'}</span>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
          {navItems.map(item => {
             const isActive = location.pathname === item.path;
             return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-[#DA291C] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                {item.icon}
                {item.name}
              </Link>
             );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
           <Link to="/" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
              <Eye className="w-5 h-5"/> Voir le site public
           </Link>
           <button 
             onClick={logout}
             className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:text-red-600 hover:bg-red-50 transition-all w-full text-left mt-2"
           >
              <LogOut className="w-5 h-5"/> Déconnexion
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-sm">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 hidden md:block">
                <Menu className="w-5 h-5 text-gray-700"/>
              </button>
              
              {/* POS SELECTOR FOR GLOBAL ADMINS */}
              {isGlobalAdmin && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select 
                    value={selectedPosId}
                    onChange={e => setSelectedPosId(e.target.value)}
                    className="bg-transparent font-bold text-gray-800 focus:outline-none text-sm appearance-none pr-4"
                  >
                    <option value="ALL">Vue Globale (Tous points de vente)</option>
                    {posList.map((pos: any) => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {!isGlobalAdmin && activePOS && (
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm">
                  Point de vente : {activePOS.name}
                </div>
              )}
           </div>
           
           <div className="flex items-center gap-4">
               <div className="hidden sm:flex flex-col items-end pr-4 border-r border-gray-200">
                  <span className="text-sm font-bold text-gray-900">{user.email}</span>
                  <span className="text-xs font-semibold text-gray-500">{roleText[role!]}</span>
               </div>
               <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-black">
                 {user.email?.charAt(0).toUpperCase()}
               </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
           <Routes>
             <Route path="/" element={<Dashboard />} />
             <Route path="orders" element={<Orders />} />
             <Route path="categories" element={<Categories />} />
             <Route path="products" element={<Products />} />
             <Route path="drivers" element={<Drivers />} />
             <Route path="pos" element={<POSManager />} />
             <Route path="users" element={<UsersAdmin />} />
             <Route path="settings" element={<AdminSettings />} />
             <Route path="reservations" element={<Reservations />} />
             <Route path="callbacks" element={<Callbacks />} />
           </Routes>
        </main>
      </div>
    </div>
  );
}
