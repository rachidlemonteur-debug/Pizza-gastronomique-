import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Phone, CreditCard, Banknote, Clock } from 'lucide-react';
import { useCart } from '../App';
import { useFirestore } from '../hooks/useFirestore';
import { auth, db } from '../firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

export function PageCheckout() {
  const { cart, getCartTotal, clearCart, formatPriceC, globalConfig, selectedPOS, activeOrder, setActiveOrder, isLoggedIn } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderMode, setOrderMode] = useState<'livraison' | 'emporter'>('livraison');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('asap');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { add: addOrder } = useFirestore('orders');

  const total = getCartTotal() + (globalConfig?.deliveryFee || 0);

  const handlePayment = async () => {
    if (cart.length === 0) {
      setError("Votre panier est vide");
      return;
    }
    
    if (orderMode === 'livraison' && !address.trim()) {
      setError("Veuillez saisir votre adresse de livraison.");
      return;
    }

    if (['mvola', 'orange'].includes(paymentMethod) && !phoneNumber.trim()) {
      setError("Veuillez saisir votre numéro de téléphone pour le paiement mobile.");
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    // Simulate payment API call
    setTimeout(async () => {
      try {
        const orderRef = doc(collection(db, 'orders'));
        const orderId = orderRef.id;
        const shortOrderNum = 'CMD-' + Math.floor(100000 + Math.random() * 900000).toString().substring(0, 4);

        let initialStatus = 'pending';
        if (globalConfig?.customStatuses && globalConfig.customStatuses.length > 0) {
           initialStatus = globalConfig.customStatuses[0].id;
        }

        const newOrderData: any = {
           id: orderId,
           orderNumber: shortOrderNum,
           status: initialStatus,
           total: total,
           items: [...cart],
           orderMode: orderMode,
           address: address || '',
           paymentMethod,
           paymentPhone: phoneNumber,
           deliveryTime,
           posId: selectedPOS?.id?.toString() || 'unknown',
           posName: selectedPOS?.name || 'Restaurant inconnu',
           timestamp: Date.now()
        };
        
        if (isLoggedIn && auth.currentUser) newOrderData.userId = auth.currentUser.uid;
        
        // Save to firestore with correct ID
        await setDoc(orderRef, newOrderData);
        
        setActiveOrder(newOrderData);
        localStorage.setItem('gastro_active_order', JSON.stringify(newOrderData));
        clearCart();
        
        setSuccess(true);
        setTimeout(() => {
          navigate(`/tracking/${orderId}`);
        }, 2000);
      } catch (err) {
        console.error(err);
        setError("Une erreur est survenue lors du paiement. Veuillez réessayer.");
        setIsProcessing(false);
      }
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-white text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <h1 className="font-black text-3xl text-gray-900 mb-2">Paiement Validé !</h1>
        <p className="text-gray-500 font-medium">Votre commande est confirmée et part en préparation.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <button onClick={() => navigate('/menu')} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#DA291C] transition-colors mb-6">
           <ArrowLeft className="w-4 h-4" /> Retour au menu
        </button>

        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-8">Paiement</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-lg text-gray-900 mb-4">Type de commande</h3>
                <div className="flex bg-gray-50 p-1 rounded-xl">
                  <button 
                    onClick={() => setOrderMode('livraison')}
                    className={`flex-1 py-3 text-sm font-black uppercase rounded-lg transition-all ${orderMode === 'livraison' ? 'bg-white shadow-sm text-[#DA291C]' : 'text-gray-500'}`}
                  >
                    Livraison
                  </button>
                  <button 
                    onClick={() => setOrderMode('emporter')}
                    className={`flex-1 py-3 text-sm font-black uppercase rounded-lg transition-all ${orderMode === 'emporter' ? 'bg-white shadow-sm text-[#DA291C]' : 'text-gray-500'}`}
                  >
                    À emporter
                  </button>
                </div>
                
                {orderMode === 'livraison' && (
                  <div className="mt-4">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Adresse de livraison</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Votre adresse complète..." className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-[#DA291C] font-bold" />
                  </div>
                )}
             </div>

             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#DA291C]"/> Mode de paiement</h3>
                
                <div className="space-y-3">
                  {globalConfig?.paymentMvola !== false && (
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'mvola' ? 'border-[#DA291C] bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="payment" value="mvola" checked={paymentMethod === 'mvola'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                      <div className="w-8 h-8 rounded-full bg-green-500 flex flex-shrink-0 items-center justify-center text-white font-black text-xs">MV</div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">MVola</div>
                        <div className="text-xs text-gray-500">Paiement mobile Telma</div>
                      </div>
                    </label>
                  )}

                  {globalConfig?.paymentOrange !== false && (
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'orange' ? 'border-[#DA291C] bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="payment" value="orange" checked={paymentMethod === 'orange'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex flex-shrink-0 items-center justify-center text-white font-black text-xs">OM</div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">Orange Money</div>
                        <div className="text-xs text-gray-500">Paiement mobile Orange</div>
                      </div>
                    </label>
                  )}

                  {globalConfig?.paymentCash !== false && (
                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-[#DA291C] bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex flex-shrink-0 items-center justify-center text-gray-600"><Banknote className="w-4 h-4"/></div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">Paiement à la livraison / Sur place</div>
                        <div className="text-xs text-gray-500">Espèces ou TPE</div>
                      </div>
                    </label>
                  )}
                </div>

                {['mvola', 'orange'].includes(paymentMethod) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-gray-100 overflow-hidden">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Numéro {paymentMethod === 'mvola' ? 'Telma' : 'Orange'}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="034 00 000 00" className="w-full bg-gray-50 border-0 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-[#DA291C] font-bold" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                       {paymentMethod === 'mvola' ? 'Un menu USSD apparaîtra sur votre téléphone (#111#) pour valider.' : 'Un menu de validation Orange Money apparaîtra sur votre téléphone.'}
                    </p>
                  </motion.div>
                )}
             </div>
             
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-lg text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[#DA291C]"/> Heure de livraison</h3>
                <select value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="w-full bg-gray-50 border-0 p-3 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-[#DA291C]">
                  <option value="asap">Le plus tôt possible (~30 min)</option>
                  <option value="12h00">Aujourd'hui à 12:00</option>
                  <option value="19h00">Aujourd'hui à 19:00</option>
                  <option value="20h00">Aujourd'hui à 20:00</option>
                </select>
             </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-black text-lg text-gray-900 mb-4">Récapitulatif</h3>
              <div className="space-y-3 mb-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{item.quantity}x {item.product.name}</span>
                    <span className="font-bold text-gray-900 text-nowrap">{formatPriceC(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Sous-total</span>
                  <span>{formatPriceC(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Frais de livraison</span>
                  <span>{formatPriceC(globalConfig?.deliveryFee || 0)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                  <span className="font-black text-gray-900 text-lg">Total</span>
                  <span className="font-black text-[#DA291C] text-xl">{formatPriceC(total)}</span>
                </div>
              </div>

              {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl">{error}</div>}

              <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-[#DA291C] text-white font-black uppercase tracking-tight py-4 rounded-xl mt-6 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Traitement...' : `Payer ${formatPriceC(total)}`}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}