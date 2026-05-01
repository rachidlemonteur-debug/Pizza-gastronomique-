import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bike, CheckCircle, Package, Phone, Timer, MapPin, Search, Navigation, User, LogOut, Star, X, Power } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCart } from '../App';

export function PageLivreur() {
  const { data: allOrders, loading, update } = useFirestore('orders', 'timestamp');
  const { data: drivers, update: updateDriver } = useFirestore('drivers', 'createdAt');
  const { formatPriceC, globalConfig } = useCart();
  const [activeTab, setActiveTab] = useState<'encours' | 'historique'>('encours');
  const [driverIdentity, setDriverIdentity] = useState<{ id: string, name: string, phone: string, onlineStatus?: string } | null>(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [ratingOrder, setRatingOrder] = useState<any>(null); // Order to rate after completion

  useEffect(() => {
    const saved = localStorage.getItem('gastro_driver_identity');
    if (saved) {
      setDriverIdentity(JSON.parse(saved));
    }
  }, []);

  const currentDriverStore = drivers?.find((d: any) => d.id === driverIdentity?.id);
  const onlineStatus = currentDriverStore?.onlineStatus || 'offline'; // 'available', 'busy', 'offline'

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) return;
    
    // Find driver by phone (and maybe ensure they are active)
    const driver = drivers?.find((d: any) => d.phone === loginPhone.trim() && d.status === 'active');
    if (!driver) {
      setLoginError('Numéro non reconnu ou compte inactif.');
      return;
    }
    
    const identity = { id: driver.id, name: driver.name, phone: driver.phone };
    localStorage.setItem('gastro_driver_identity', JSON.stringify(identity));
    setDriverIdentity(identity);
    setLoginError('');
  };
  
  const handleLogout = () => {
    if (driverIdentity) {
      updateDriver(driverIdentity.id, { onlineStatus: 'offline' });
    }
    localStorage.removeItem('gastro_driver_identity');
    setDriverIdentity(null);
  };

  const toggleOnlineStatus = async () => {
    if (!driverIdentity) return;
    const nextStatus = onlineStatus === 'offline' ? 'available' : 'offline';
    await updateDriver(driverIdentity.id, { onlineStatus: nextStatus });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#DA291C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Active delivery for this driver
  const activeDelivery = allOrders?.find((o:any) => ['delivering', 'arrived'].includes(o.status) && o.driver?.id === driverIdentity?.id);
  
  // Pending assigned orders for THIS specific driver
  const assignedOrders = allOrders?.filter((o:any) => o.status === 'assigned' && o.driver?.id === driverIdentity?.id)?.sort((a:any, b:any) => a.timestamp - b.timestamp);
  const offeredOrder = (onlineStatus === 'available' && !activeDelivery && assignedOrders && assignedOrders?.length > 0) ? assignedOrders[0] : null;

  const historyOrders = allOrders?.filter((o:any) => ['completed', 'canceled'].includes(o.status) && o.driver?.id === driverIdentity?.id)?.sort((a:any, b:any) => b.timestamp - a.timestamp);

  const updateOrderStatus = async (docId: string, newStatus: string, additionalProps = {}) => {
    try {
      const payload: any = { status: newStatus, ...additionalProps };
      if (newStatus === 'delivering' && driverIdentity) {
        payload.driver = driverIdentity;
        // Also mark driver as busy
        await updateDriver(driverIdentity.id, { onlineStatus: 'busy' });
      }
      if (newStatus === 'arrived' && driverIdentity) {
        // Mark driver as available again (or stay busy?), stay busy maybe, but they can't take orders yet
        // Wait, what if they become available when arrived? Probably not, they need to return or they are still assigned to this order
      }
      await update(docId, payload);
    } catch (e) {
      console.error(e);
    }
  };

  const acceptOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'delivering');
  };

  const markArrived = async (order: any) => {
    await updateOrderStatus(order.id, 'arrived');
    // Driver can rate client when marking arrived, or maybe just wait.
    setRatingOrder(order);
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
             <div className="relative">
               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input 
                 type="tel" 
                 placeholder="Numéro de téléphone" 
                 value={loginPhone}
                 onChange={(e) => setLoginPhone(e.target.value)}
                 className="w-full bg-gray-50 border-2 border-gray-100 focus:border-[#DA291C] focus:ring-0 rounded-xl pl-12 pr-4 py-4 font-bold text-lg transition-all"
                 required
               />
             </div>
             <button type="submit" className="w-full bg-[#DA291C] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 active:scale-95">
               Connexion
             </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24 relative">
      {/* Header Mobile First */}
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-200 sticky top-0 z-40 shadow-sm flex flex-col gap-4">
         <div className="flex justify-between items-center">
            <div>
              <h1 className="font-black text-xl text-gray-900 tracking-tight">Bonjour, {driverIdentity.name.split(' ')[0]}</h1>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 rounded-full bg-gray-100 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
         </div>

         {/* Status Toggle */}
         <button 
           onClick={toggleOnlineStatus}
           className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 ${onlineStatus === 'available' ? 'bg-[#25D366] text-white shadow-green-500/20' : onlineStatus === 'busy' ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-gray-200 text-gray-500 shadow-none hover:bg-gray-300'}`}
         >
            <Power className="w-5 h-5" />
            {onlineStatus === 'available' ? 'En ligne - Prêt' : onlineStatus === 'busy' ? 'Occupé - En Course' : 'Hors ligne'}
         </button>
      </div>

      <div className="p-4 relative">
        
        {/* NEW ORDER POPUP OVERLAY */}
        <AnimatePresence>
          {offeredOrder && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 bg-[#DA291C] text-white flex flex-col p-6 pb-12 overflow-y-auto">
               <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 mb-8">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Package className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Nouvelle Course !</h2>
                  <p className="text-red-100 font-bold text-lg mb-8">Un client vous attend.</p>
                  
                  <div className="bg-white/10 rounded-3xl p-6 w-full max-w-sm backdrop-blur-sm border border-white/20 mb-8 shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-200 mb-1">Destination</p>
                    <h3 className="font-black text-2xl mb-4 leading-tight">{offeredOrder.address}</h3>
                    
                    <div className="w-full h-[1px] bg-white/20 mb-4"></div>
                    
                    <div className="flex justify-between items-center text-left">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-red-200 mb-1">Gain estimé</p>
                         <p className="font-black text-2xl">{formatPriceC(globalConfig?.deliveryFee || 2000)}</p>
                       </div>
                    </div>
                  </div>
               </div>
               
               <div className="flex flex-col gap-3 shrink-0">
                 <button onClick={() => acceptOrder(offeredOrder.id)} className="w-full bg-white text-[#DA291C] py-5 rounded-2xl font-black uppercase text-lg tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                   <CheckCircle className="w-6 h-6" /> Accepter la course
                 </button>
                 <button onClick={() => updateDriver(driverIdentity.id, { onlineStatus: 'offline' })} className="w-full bg-transparent border-2 border-white/30 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest active:scale-95 transition-transform hover:bg-white/10 hover:border-white/50">
                   Refuser (Passer Hors Ligne)
                 </button>
               </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIVE DELIVERY */}
        {activeDelivery ? (
          <div className="space-y-4">
             <div className="bg-white rounded-[2rem] border-2 border-[#DA291C] shadow-xl overflow-hidden relative">
               <div className="bg-[#DA291C] px-6 py-4 text-white flex justify-between items-center">
                 <span className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><Bike className="w-5 h-5"/> Course en cours</span>
                 <span className="font-black bg-white/20 px-3 py-1 rounded-full text-xs">#{activeDelivery.orderNumber || activeDelivery.id?.substring(0,4)}</span>
               </div>
               <div className="p-6">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-2xl text-gray-900 leading-tight">{activeDelivery.customerName}</h3>
                 </div>
                 <p className="text-gray-500 font-bold flex items-center gap-2 text-lg mb-6"><MapPin className="w-5 h-5 text-[#DA291C] shrink-0" /> {activeDelivery.address}</p>
                 
                 <div className="flex gap-3 mb-6">
                   <a href={`tel:${activeDelivery.paymentPhone}`} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
                     <Phone className="w-5 h-5" /> Appeler
                   </a>
                   <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeDelivery.address)}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 py-4 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
                     <Navigation className="w-5 h-5" /> GPS
                   </a>
                 </div>

                 <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                   <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Détails de la commande</div>
                   <div className="space-y-1 mb-4">
                     {activeDelivery.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm font-bold items-center">
                          <span className="text-[#DA291C] pr-2 mr-2 w-8 text-right font-black">{item.quantity}x</span>
                          <span className="flex-1 text-gray-700">{item.product?.name}</span>
                        </div>
                     ))}
                   </div>
                   <div className="flex justify-between items-center text-lg">
                     <span className="font-bold text-gray-500 uppercase text-xs tracking-widest">À Encaisser Client</span>
                     <span className="font-black text-[#DA291C]">{formatPriceC(activeDelivery.total)}</span>
                   </div>
                 </div>

                 {activeDelivery.status === 'delivering' ? (
                   <button onClick={() => markArrived(activeDelivery)} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase text-lg tracking-widest shadow-xl shadow-gray-900/20 active:scale-95 transition-transform">
                     Je suis arrivé s/ place
                   </button>
                 ) : (
                   <div className="w-full bg-green-100 text-green-800 py-5 rounded-2xl font-black uppercase text-lg tracking-widest text-center flex flex-col items-center justify-center gap-1">
                     <span className="flex items-center gap-2"><CheckCircle className="w-6 h-6" /> Arrivé sur place</span>
                     <span className="text-xs font-bold text-green-700 opacity-80 mt-1 lowercase first-letter:uppercase">En attente de validation par le gérant</span>
                   </div>
                 )}
               </div>
             </div>
          </div>
        ) : (
          !offeredOrder && (
            <div className="text-center pt-24 pb-8 flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Bike className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="font-black text-2xl text-gray-900 mb-2">
                {onlineStatus === 'available' ? 'En attente...' : 'Déconnecté'}
              </h3>
              <p className="text-gray-500 font-bold max-w-[250px] mx-auto text-sm">
                 {onlineStatus === 'available' 
                   ? "Restez dans cette zone, les nouvelles courses apparaîtront ici automatiquement." 
                   : "Mettez-vous 'En ligne' pour recevoir des propositions de livraison."}
              </p>
            </div>
          )
        )}

        {/* HISTORIQUE */}
        {!activeDelivery && !offeredOrder && historyOrders && historyOrders.length > 0 && (
          <div className="mt-12">
            <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight mb-4 px-2">Mes dernières courses</h3>
            <div className="space-y-3">
               {historyOrders.slice(0, 10).map((order: any) => (
                 <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-gray-900 text-base">{order.customerName || 'Client anonyme'}</h4>
                      <p className="text-xs font-bold text-gray-500 flex items-center gap-1 line-clamp-1 mt-1"><MapPin className="w-3 h-3"/> {order.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <span className="text-[#25D366] font-black flex items-center gap-1 text-sm bg-green-50 px-3 py-1.5 rounded-xl"><CheckCircle className="w-4 h-4"/> Livré</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* RATING MODAL (DRIVER TO CLIENT) */}
      <AnimatePresence>
        {ratingOrder && (
           <DriverRatingModal 
             order={ratingOrder}
             onClose={() => setRatingOrder(null)}
           />
        )}
      </AnimatePresence>

    </div>
  );
}

function DriverRatingModal({ order, onClose }: { order: any, onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle'|'loading'|'success'>('idle');
  const availableTags = ['Respectueux', 'Facile à joindre', 'Adresse correcte', 'Problème de comportement', 'Injoignable'];

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setStatus('loading');
    try {
      const { addDoc, collection, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      
      // Add review
      await addDoc(collection(db, 'reviews'), {
        type: 'driver_to_client',
        orderId: order.id,
        driverId: order.driver?.id || null, // Will use current driver ID
        rating,
        tags,
        createdAt: Date.now()
      });

      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
         <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] p-8 text-center max-w-sm w-full shadow-2xl">
            <CheckCircle className="w-20 h-20 text-[#25D366] mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">Merci !</h3>
            <p className="text-gray-500 font-bold">Votre retour nous aide à optimiser le service.</p>
         </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4 pb-8 sm:pb-4"
    >
      <motion.div 
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative"
      >
         <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full"><X className="w-5 h-5"/></button>
         <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2 text-center mt-2">Notez le client</h3>
         <p className="text-center text-gray-500 font-bold mb-8 text-sm">Comment c'est passé la livraison avec {order.customerName} ?</p>
         
         <div className="flex justify-center gap-2 mb-8">
           {[1, 2, 3, 4, 5].map((star) => (
             <button 
               key={star}
               onMouseEnter={() => setHoverRating(star)}
               onMouseLeave={() => setHoverRating(0)}
               onClick={() => setRating(star)}
               className="p-1 transition-transform hover:scale-110 active:scale-90"
             >
               <Star className={`w-12 h-12 ${star <= (hoverRating || rating) ? 'fill-[#FFC72C] text-[#FFC72C]' : 'text-gray-200'}`} />
             </button>
           ))}
         </div>

         {rating > 0 && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             <p className="font-bold text-center text-gray-400 uppercase text-[10px] tracking-widest mb-4">Tags rapides (Optionnel)</p>
             <div className="flex flex-wrap justify-center gap-2 mb-8">
                {availableTags.map(tag => (
                   <button 
                      key={tag} 
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full font-bold text-xs transition-all active:scale-95 border-2 ${tags.includes(tag) ? 'bg-[#DA291C] text-white border-transparent' : 'bg-transparent text-gray-500 border-gray-100 hover:border-gray-200'}`}
                   >
                     {tag}
                   </button>
                ))}
             </div>
             <button 
               onClick={handleSubmit} 
               disabled={status === 'loading'}
               className="w-full bg-gray-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest active:scale-95 transition-transform shadow-xl hover:bg-black"
             >
               {status === 'loading' ? 'Enregistrement...' : 'Valider'}
             </button>
           </motion.div>
         )}
      </motion.div>
    </motion.div>
  );
}
