import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bike, CheckCircle, Package, Phone, Timer, MapPin, Search, Navigation, User, LogOut } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCart } from '../App';

export function PageLivreur() {
  const { data: allOrders, loading, update } = useFirestore('orders', 'timestamp');
  const { data: drivers } = useFirestore('drivers', 'createdAt');
  const { formatPriceC, globalConfig } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'encours' | 'historique'>('encours');
  const [driverIdentity, setDriverIdentity] = useState<{ id: string, name: string, phone: string } | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const lastLocationUpdate = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('gastro_driver_identity');
    if (saved) {
      setDriverIdentity(JSON.parse(saved));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !loginPhone.trim()) return;
    
    const driver = drivers?.find((d: any) => d.id === selectedDriverId);
    if (!driver || driver.phone !== loginPhone.trim()) {
      setLoginError('Vérifiez votre numéro de téléphone.');
      return;
    }
    
    const identity = { id: driver.id, name: driver.name, phone: driver.phone };
    localStorage.setItem('gastro_driver_identity', JSON.stringify(identity));
    setDriverIdentity(identity);
    setLoginError('');
  };
  
  const handleLogout = () => {
    localStorage.removeItem('gastro_driver_identity');
    setDriverIdentity(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#DA291C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const inProgressStatuses = ['preparing', 'ready', 'delivering', 'pending'];
  const historyStatuses = ['completed', 'canceled'];

  const orders = allOrders
    ?.filter((o: any) => o.orderMode === 'livraison')
    ?.filter((o: any) => activeTab === 'encours' ? inProgressStatuses.includes(o.status) : historyStatuses.includes(o.status))
    // If it's history, filter by my deliveries
    ?.filter((o: any) => activeTab === 'historique' ? o.driver?.id === driverIdentity?.id : true)
    // If it's 'delivering', only show if assigned to me
    ?.filter((o: any) => o.status === 'delivering' ? o.driver?.id === driverIdentity?.id : true)
    ?.filter((o: any) => 
      !searchTerm || 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    ?.sort((a: any, b: any) => b.timestamp - a.timestamp);

  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const statuses = globalConfig?.customStatuses || [
    { id: 'pending', label: 'Nouvelle' },
    { id: 'preparing', label: 'En cuisine' },
    { id: 'ready', label: 'Prête' },
    { id: 'delivering', label: 'En livraison' },
    { id: 'completed', label: 'Terminée' },
    { id: 'canceled', label: 'Annulée' }
  ];

  const getStatusLabel = (statusId: string) => {
    return statuses.find((s: any) => s.id === statusId)?.label || statusId;
  };

  const updateOrderStatus = async (docId: string, newStatus: string) => {
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'delivering' && driverIdentity) {
        payload.driver = driverIdentity;
      }
      await update(docId, payload);
    } catch (e) {
      console.error(e);
    }
  };

  if (!driverIdentity) {
    return (
      <div className="bg-gray-50 min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full mx-4 border border-gray-100">
           <div className="w-16 h-16 bg-[#DA291C]/10 text-[#DA291C] flex items-center justify-center rounded-2xl mx-auto mb-6">
             <Bike className="w-8 h-8" />
           </div>
           <h2 className="text-2xl font-black text-center mb-2 uppercase tracking-tight">Espace Livreur</h2>
           <p className="text-center text-gray-500 font-bold text-sm mb-8">Identifiez-vous pour gérer vos courses.</p>
           
           <form onSubmit={handleLogin} className="space-y-4">
             {loginError && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-2 rounded-lg">{loginError}</p>}
             <select 
               value={selectedDriverId}
               onChange={(e) => setSelectedDriverId(e.target.value)}
               className="w-full bg-gray-50 border-2 border-gray-100 focus:border-[#DA291C] focus:ring-0 rounded-xl px-4 py-4 font-bold text-gray-900 transition-all text-center appearance-none"
               required
             >
               <option value="">-- Sélectionnez votre profil --</option>
               {drivers?.filter((d:any) => d.status === 'active').map((d:any) => (
                 <option key={d.id} value={d.id}>{d.name} {d.zone ? `(${d.zone})` : ''}</option>
               ))}
             </select>
             <input 
               type="tel" 
               placeholder="Votre numéro (mot de passe)" 
               value={loginPhone}
               onChange={(e) => setLoginPhone(e.target.value)}
               className="w-full bg-gray-50 border-2 border-gray-100 focus:border-[#DA291C] focus:ring-0 rounded-xl px-4 py-4 text-center font-bold text-lg transition-all"
               required
             />
             <button type="submit" className="w-full bg-[#DA291C] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
               Se connecter
             </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#DA291C]/10 text-[#DA291C] flex items-center justify-center rounded-2xl">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">Livreur</h1>
              <p className="text-gray-500 font-bold text-sm">Gestion des courses</p>
            </div>
          </div>
          
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-gray-500 hover:text-[#DA291C] hover:border-red-200 transition-colors active:scale-95 shadow-sm">
             <User className="w-4 h-4" />
             <span className="font-bold text-sm">{driverIdentity.name}</span>
             <LogOut className="w-4 h-4 ml-2 opacity-50" />
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-white p-2 border border-gray-100 rounded-2xl shadow-sm">
          <button 
             onClick={() => setActiveTab('encours')}
             className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
               activeTab === 'encours' 
                 ? 'bg-[#DA291C] text-white shadow-md' 
                 : 'text-gray-500 hover:bg-gray-50'
             }`}
          >
            En cours
          </button>
          <button 
             onClick={() => setActiveTab('historique')}
             className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
               activeTab === 'historique' 
                 ? 'bg-gray-900 text-white shadow-md' 
                 : 'text-gray-500 hover:bg-gray-50'
             }`}
          >
            Historique
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 mb-6">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher une commande, un client..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-0 p-0 focus:ring-0 text-sm font-bold text-gray-900 outline-none" 
          />
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {orders?.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 flex flex-col items-center">
                 <Package className="w-16 h-16 text-gray-200 mb-4" />
                 <h3 className="font-black text-xl text-gray-900 mb-2">Aucune course {activeTab === 'encours' ? 'active' : ''}</h3>
                 <p className="text-gray-500 font-medium">Toutes les commandes en livraison ont été traitées ou aucune n'est en cours.</p>
              </motion.div>
            ) : (
               orders?.map((order: any) => (
                 <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={order.id} className={`bg-white rounded-[1.5rem] border ${order.status === 'delivering' ? 'border-[#DA291C] shadow-[0_10px_20px_rgba(218,41,28,0.15)]' : 'border-gray-200 shadow-sm'} overflow-hidden`}>
                    
                    {/* Status Banner */}
                    <div className={`px-5 py-3 flex items-center justify-between ${order.status === 'delivering' ? 'bg-[#DA291C] text-white' : order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                      <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
                        {order.status === 'delivering' && <Bike className="w-4 h-4" />}
                        {order.status === 'ready' && <Package className="w-4 h-4" />}
                        {order.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {getStatusLabel(order.status)}
                        {order.status === 'delivering' && (
                          <div className="flex items-center gap-2 bg-white/20 text-white font-black text-[10px] px-2 py-1 rounded-md ml-2">
                             <User className="w-3 h-3" />
                             Assigné à vous
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-xs">#{order.orderNumber || order.id?.substring(0,6)}</span>
                    </div>

                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:justify-between mb-4 gap-4">
                         <div>
                           <h3 className="font-black text-xl text-gray-900 leading-tight">{order.customerName || 'Client anonyme'}</h3>
                           <div className="flex items-center gap-1 text-gray-500 text-sm font-bold mt-1">
                              <MapPin className="w-4 h-4" />
                              {order.address || 'Adresse non spécifiée'}
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-3">
                           {order.paymentPhone && activeTab === 'encours' && (
                             <a href={`tel:${order.paymentPhone}`} className="bg-gray-100 p-3 rounded-full text-gray-700 hover:bg-gray-200 active:scale-95 transition-all">
                               <Phone className="w-5 h-5" />
                             </a>
                           )}
                           <div className="bg-gray-50 px-4 py-2 rounded-xl text-right">
                             <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total à payer</div>
                             <div className="font-black text-gray-900 whitespace-nowrap">{formatPriceC(order.total)}</div>
                           </div>
                         </div>
                      </div>

                      {order.address && activeTab === 'encours' && (
                        <div className="flex gap-2 mb-4">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all flex-1"
                          >
                            <Navigation className="w-4 h-4" /> Itinéraire Google Maps
                          </a>
                        </div>
                      )}

                      <div className="bg-gray-50 p-4 rounded-xl mb-4">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Package className="w-3 h-3" /> Contenu de la commande</div>
                        <div className="space-y-1">
                          {order.items?.map((item: any, idx: number) => (
                             <div key={idx} className="flex justify-between text-sm font-medium items-center">
                               <span className="text-gray-900 border-r border-gray-200 pr-2 mr-2 w-8 text-right font-black">{item.quantity}x</span>
                               <span className="flex-1 text-gray-700">{item.product?.name}</span>
                             </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                         {order.status === 'ready' && (
                           <button onClick={() => updateOrderStatus(order.id, 'delivering')} className="flex-1 bg-[#DA291C] hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/20 active:scale-95">
                             <Bike className="w-5 h-5" />
                             Prendre en charge
                           </button>
                         )}
                         {order.status === 'delivering' && (
                           <button onClick={() => updateOrderStatus(order.id, 'completed')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20 active:scale-95">
                             <CheckCircle className="w-5 h-5" />
                             Marquer comme livré
                           </button>
                         )}
                         {['pending', 'preparing'].includes(order.status) && (
                           <div className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 text-center">
                             En cuisine - Patientez...
                           </div>
                         )}
                      </div>
                    </div>
                 </motion.div>
               ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
