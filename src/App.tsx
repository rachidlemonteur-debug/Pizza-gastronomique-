import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';                
import { db, auth } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, MapPin, Plus, Minus, MessageCircle, Phone, 
  Menu as MenuIcon, X, ArrowRight, UtensilsCrossed, Timer, 
  Gift, Star, Smartphone, ChevronRight, Car, Package, Heart, Trash2, Lock, Search, QrCode, LogOut, Home, Navigation, Bike, CheckCircle, AlertTriangle, RefreshCcw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
// @ts-ignore
if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}
import AdminApp from './Admin';
import { useFirestore } from './hooks/useFirestore';
import { PagePrivacy, PageTerms, PageCookies, PageDelivery, PageAbout, PageContact } from './LegalPages';

// --- ROBUST API SIMULATION UTILITY ---
const simulateApiCall = <T,>(data: T, failureRate: number = 0.3, delay: number = 800): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failureRate) {
        reject(new Error("La requête réseau a échoué. Problème de connexion avec le serveur."));
      } else {
        resolve(data);
      }
    }, delay);
  });
};

// --- GLOBAL ERROR COMPONENT ---
function ApiErrorState({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-red-50 text-[#DA291C] rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-red-100 transform -rotate-3">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h3 className="font-black text-2xl text-gray-900 mb-2 uppercase tracking-tight">Oups ! Erreur Serveur</h3>
      <p className="font-bold text-gray-500 mb-8">{message}</p>
      <button 
        onClick={onRetry} 
        className="bg-[#DA291C] text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider shadow-[0_4px_15px_rgba(218,41,28,0.4)] hover:bg-red-700 hover:scale-105 transition-all border-b-[4px] border-red-900 active:border-b-0 active:scale-95 active:translate-y-[4px] flex gap-3 items-center mx-auto"
      >
        <RefreshCcw className="w-5 h-5" /> Tenter de nouveau
      </button>
    </div>
  );
}

const storeIcon = new L.DivIcon({
  html: `<div style="background-color: #DA291C; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><span style="color: #FFC72C; font-weight: 900; font-family: sans-serif; font-size: 16px;">G.</span></div>`,
  className: '', iconSize: [32, 32], iconAnchor: [16, 32],
});
const bikeIcon = new L.DivIcon({
  html: `<div style="background-color: #FFC72C; width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 22px;">🛵</div>`,
  className: '', iconSize: [44, 44], iconAnchor: [22, 22],
});
const homeIcon = new L.DivIcon({
  html: `<div style="background-color: #25D366; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 16px;">📍</div>`,
  className: '', iconSize: [32, 32], iconAnchor: [16, 32],
});

// --- DATA: FRANCHISE DRIVEN ---
export const CATEGORIES = [
  { id: 'all', name: 'Tous', icon: '🍽️', color: 'bg-gray-100', text: 'text-gray-600' },
  { id: '1', name: 'Nos Menus XL', icon: '🍟', color: 'bg-[#FFC72C]', text: 'text-[#DA291C]' },
  { id: '2', name: 'Les Burgers', icon: '🍔', color: 'bg-orange-100', text: 'text-orange-600' },
  { id: '3', name: 'Pizzas XXL', icon: '🍕', color: 'bg-red-100', text: 'text-red-600' },
  { id: '4', name: 'Kids Box', icon: '🎈', color: 'bg-blue-100', text: 'text-blue-600' },
  { id: '5', name: 'Boissons', icon: '🥤', color: 'bg-pink-100', text: 'text-pink-600' },
];

const PROMOS = [
  { id: 'promo1', title: 'Le Menu Family', subtitle: '4 Burgers + 4 Frites + Boisson 2L', price: '45 000 Ar', image: 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=800&q=80', color: 'bg-[#DA291C]', text: 'text-white' },
  { id: 'promo2', title: 'Box Enfant', subtitle: 'Menu complet + 1 Jouet Magique', tag: 'Nouveau Jouet !', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80', color: 'bg-[#FFC72C]', text: 'text-[#DA291C]' },
];

export const PRODUCTS = [
  { id: 'p1', name: 'Menu Big Gastro', description: 'Notre burger signature double étage, portion de frites dorées moyenne, boisson 40cl au choix.', price: 18000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=100', categoryId: '1', badge: 'N°1 Des Ventes', popular: true },
  { id: 'p5', name: 'Menu Pizza Suprême', description: 'Pizza moyenne au choix, 2 ailerons croustillants, boisson 40cl.', price: 22000, image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=100', categoryId: '1', popular: true },
  { id: 'p2', name: 'Burger Chicken Crispy', description: 'Poulet pané aux 11 épices, mayonnaise légère, salade croquante.', price: 12000, oldPrice: 15000, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=100', categoryId: '2', badge: 'Deal', popular: true },
  { id: 'p6', name: 'Burger Rustique', description: 'Steak façon boucher, tomme fondue, oignons caramélisés et sauce poivre.', price: 16000, image: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=800&q=100', categoryId: '2', popular: true },
  { id: 'p3', name: 'Pizza Reine XXL (40cm)', description: 'Jambon de dinde, champignons de Paris, double mozzarella, pâte fraîche du jour.', price: 32000, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=100', categoryId: '3', popular: false },
  { id: 'p7', name: 'Pizza Spicy Chicken', description: 'Poulet épicé, poivrons rouges, piment jalapeño, mozzarella.', price: 29000, image: 'https://images.unsplash.com/photo-1590947132387-15500021b369?w=800&q=100', categoryId: '3', popular: false },
  { id: 'p4', name: 'Magic Kids Box', description: 'Cheeseburger enfant, mini frites, jus de fruit 20cl, 1 jouet exclusif.', price: 10000, image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800&q=100', categoryId: '4', popular: true },
  { id: 'p8', name: 'Soda Limonade G.', description: 'Notre limonade artisanale hyper rafraîchissante, citron vert et menthe.', price: 4000, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=100', categoryId: '5', popular: true }
];

export const RESTAURANTS = [
  { id: 1, country: 'MG', name: "Gastro Analakely", address: "Avenue de l'Indépendance", distance: "0.5 km", status: "Ouvert - Drive 24h/24", phone: "032 07 350 26", type: "Drive & Sur place", lat: -18.905, lng: 47.525 },
  { id: 2, country: 'MG', name: "Gastro Ankorondrano", address: "Galerie Zodiaque", distance: "3.2 km", status: "Ouvert jusqu'à 23h", phone: "032 07 350 27", type: "Sur place & Bornes", lat: -18.880, lng: 47.520 },
  { id: 3, country: 'MG', name: "Gastro Ilafy", address: "Parc commercial", distance: "6.8 km", status: "Ouvert jusqu'à 22h", phone: "032 07 350 28", type: "Drive uniquement", lat: -18.850, lng: 47.560 },
  { id: 4, country: 'SN', name: "Gastro Almadies", address: "Route des Almadies, Dakar", distance: "1.2 km", status: "Ouvert - Drive 24h/24", phone: "77 000 00 00", type: "Drive & Sur place", lat: 14.748, lng: -17.514 },
  { id: 5, country: 'SN', name: "Gastro Plateau", address: "Avenue Pompidou, Dakar", distance: "4.5 km", status: "Ouvert jusqu'à 23h", phone: "77 000 00 01", type: "Sur place & Bornes", lat: 14.673, lng: -17.436 }
];

const COUNTRIES = {
  MG: { id: 'MG', name: 'Madagascar', flag: '🇲🇬', currency: 'MGA', phone: '261320735026', rate: 1, thresholdAmount: 40000, shortName: 'Mada' },
  SN: { id: 'SN', name: 'Sénégal', flag: '🇸🇳', currency: 'XOF', phone: '221770000000', rate: 0.1333, thresholdAmount: 5000, shortName: 'Sénégal' }
};

type ProductInfo = typeof PRODUCTS[0];
type CartItem = { product: ProductInfo, quantity: number, instructions?: string };

// --- CONTEXT ---
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: ProductInfo, quantity: number, instructions?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  getCartCount: () => number;
  getCartTotal: () => number;
  selectedProduct: ProductInfo | null;
  setSelectedProduct: (p: ProductInfo | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (b: boolean) => void;
  lastAdded: string | null;
  country: keyof typeof COUNTRIES;
  setCountry: (c: keyof typeof COUNTRIES) => void;
  formatPriceC: (price: number) => string;
  whatsappLink: string;
  whatsappNumber: string;
  isLoggedIn: boolean;
  setIsLoggedIn: (b: boolean) => void;
  activeOrder: any;
  setActiveOrder: (order: any) => void;
  clearCart: () => void;
  // Dynamic Global Data
  globalProducts: ProductInfo[];
  globalCategories: any[];
  globalConfig: any;
  globalPOS: any[];
  selectedPOS: any | null;
  setSelectedPOS: (pos: any | null) => void;
  userCoords: { lat: number, lng: number } | null;
}
const CartContext = createContext<CartContextType | null>(null);
const useCart = () => { const ctx = useContext(CartContext); if (!ctx) throw new Error("Missing CartProvider"); return ctx; };

const AppWithRouter = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <AnimatePresence mode="popLayout" onExitComplete={() => window.scrollTo(0, 0)}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<PageHome />} />
                <Route path="/menu" element={<PageMenu />} />
                <Route path="/app-fidelite" element={<PageLoyalty />} />
                <Route path="/restaurants" element={<PageRestaurants />} />
                <Route path="/tracking" element={<PageTracking />} />
                <Route path="/recrutement" element={<PageRecrutement />} />
                <Route path="/politique-de-confidentialite" element={<PagePrivacy />} />
                <Route path="/conditions-utilisation" element={<PageTerms />} />
                <Route path="/politique-cookies" element={<PageCookies />} />
                <Route path="/politique-livraison" element={<PageDelivery />} />
                <Route path="/a-propos" element={<PageAbout />} />
                <Route path="/contact" element={<PageContact />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </AnimatePresence>
    </>
  );
};

// --- MAIN APP ---
export default function App() {
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [country, setCountry] = useState<keyof typeof COUNTRIES>('MG');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [selectedPOS, setSelectedPOS] = useState<any | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);

  // Sync state with localstorage
  useEffect(() => {
    const savedCart = localStorage.getItem('gastro_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    
    const savedOrder = localStorage.getItem('gastro_active_order');
    if (savedOrder) setActiveOrder(JSON.parse(savedOrder));
  }, []);

  useEffect(() => {
    localStorage.setItem('gastro_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem('gastro_active_order', JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem('gastro_active_order');
    }
  }, [activeOrder]);

  // Dynamic Data placeholder logic to fallback while hook is implemented
  const { data: globalProductsData } = useFirestore('products');
  const { data: globalCategoriesData } = useFirestore('categories', 'orderId');
  const { data: globalConfigData } = useFirestore('config', 'brandName');
  const { data: globalPOSData } = useFirestore('points_of_sale', 'name');

  const globalProducts = globalProductsData;
  const globalCategories = globalCategoriesData;
  const globalConfig = globalConfigData.length > 0 ? globalConfigData[0] : null;
  const globalPOS = globalPOSData;

  // Find nearest POS if not already selected manually when both coords and pos data are available
  useEffect(() => {
    if (!selectedPOS && globalPOS?.length > 0) {
       if (userCoords) {
         const nearest = [...globalPOS].sort((a, b) => {
           if (a.lat === undefined || b.lat === undefined) return 0;
           const distA = Math.sqrt(Math.pow(a.lat - userCoords.lat, 2) + Math.pow(a.lng - userCoords.lng, 2));
           const distB = Math.sqrt(Math.pow(b.lat - userCoords.lat, 2) + Math.pow(b.lng - userCoords.lng, 2));
           return distA - distB;
         })[0];
         if (nearest) setSelectedPOS(nearest);
       } else {
         // Fallback to highest priority/first POS if no location yet
         setSelectedPOS(globalPOS[0]);
       }
    }
  }, [userCoords, selectedPOS, globalPOS]);

  // Read location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserCoords(coords);
      }, (err) => {
        console.warn("Geolocation permission denied", err);
      });
    }
  }, []);

  // Sync activeOrder in real-time
  useEffect(() => {
    if (!activeOrder?.id) return;
    const docRef = doc(db, 'orders', activeOrder.id);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            const serverData = snapshot.data();
            setActiveOrder((prev: any) => ({
                ...prev,
                ...serverData,
                id: snapshot.id
            }));
        }
    }, (err) => {
        console.error("Tracking order error:", err);
    });
    return () => unsubscribe();
  }, [activeOrder?.id]);

  const addToCart = (product: ProductInfo, quantity: number, instructions: string = '') => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity, instructions: instructions || item.instructions } : item);
      }
      return [...prev, { product, quantity, instructions }];
    });
    setSelectedProduct(null);
    setLastAdded(`${quantity}x ${product.name}`);
    setTimeout(() => setLastAdded(null), 3000);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  const formatPriceC = (price: number) => {
    if (country === 'SN') {
      const localPrice = Math.ceil((price * COUNTRIES.SN.rate) / 100) * 100;
      return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(localPrice);
    }
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(price);
  };

  const whatsappNumber = globalConfig?.whatsappNumber || COUNTRIES[country].phone;
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Bonjour,%20je%20souhaite%20commander.`;

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, getCartCount, getCartTotal, selectedProduct, setSelectedProduct, isCartOpen, setIsCartOpen, lastAdded, country, setCountry, formatPriceC, whatsappLink, whatsappNumber, isLoggedIn, setIsLoggedIn, activeOrder, setActiveOrder, globalProducts, globalCategories, globalConfig, globalPOS, selectedPOS, setSelectedPOS, userCoords }}>
      <Router>
        <AppWithRouter />
      </Router>
    </CartContext.Provider>
  );
}

// --- LAYOUT : FRANCHISE HEADER ---
function Layout({ children }: { children: React.ReactNode }) {
  const { 
    getCartCount, getCartTotal, setIsCartOpen, isCartOpen, 
    country, setCountry, formatPriceC, whatsappLink, whatsappNumber,
    cart, activeOrder, globalConfig, globalPOS, 
    selectedPOS, setSelectedPOS, userCoords,
    selectedProduct, setSelectedProduct, lastAdded
  } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (globalConfig?.seoTitle) {
      document.title = globalConfig.seoTitle;
    }
    if (globalConfig?.seoDesc) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', globalConfig.seoDesc);
    }
  }, [globalConfig]);

  const handleCountrySwitch = () => {
    // Basic confirmation since switching country might imply different prices
    if (cart.length > 0 && !window.confirm("Changer de pays va recalculer votre panier. Continuer ?")) return;
    setCountry(country === 'MG' ? 'SN' : 'MG');
  };
  
  const currentCountry = COUNTRIES[country];

  return (
    <div className="flex flex-col min-h-screen pb-24 sm:pb-0 overflow-x-hidden">
      {/* ACTIVE ORDER TOP BANNER */}
      {activeOrder && location.pathname !== '/tracking' && (
        <div className="bg-[#DA291C] text-white px-4 py-2 flex items-center justify-center gap-4 z-[100] relative cursor-pointer" onClick={() => navigate('/tracking')}>
           <div className="relative flex items-center justify-center">
             <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30"></div>
             <Bike className="w-5 h-5 relative z-10" />
           </div>
           <span className="font-extrabold text-sm uppercase tracking-widest text-red-50">Commande {activeOrder.orderNumber || activeOrder.id} en cours — Suivez votre livreur !</span>
           <ChevronRight className="w-4 h-4 text-white opacity-50" />
        </div>
      )}

      {/* TOP BAR / UTILITY BAR */}
      <div className="hidden md:flex bg-gray-100 text-gray-500 text-xs font-bold py-1.5 px-4 justify-between items-center z-50 relative">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex gap-4 items-center">
             <button onClick={handleCountrySwitch} className="hover:text-gray-900 border border-gray-300 rounded px-2 py-0.5 flex gap-1 items-center bg-white transition-colors">
                <span className="text-sm leading-none">{currentCountry.flag}</span> <span className="uppercase tracking-widest">{currentCountry.name}</span>
             </button>
             <span className="border-l border-gray-300 pl-4 flex items-center gap-1">
                <Phone className="w-3 h-3"/> Appeler: {currentCountry.phone}
             </span>
             <span className="border-l border-gray-300 pl-4">Livraison gratuite dès {formatPriceC(currentCountry.thresholdAmount)}</span>
          </div>
          <div className="flex gap-4 items-center">
             <a href={whatsappLink} target="_blank" rel="noreferrer" className="hover:text-[#25D366] flex items-center gap-1 font-extrabold text-[#25D366]"><MessageCircle className="w-3 h-3"/> WhatsApp</a>
             <Link to="/tracking" className="hover:text-[#DA291C] border-l border-gray-300 pl-4">Suivre ma commande</Link>
             <Link to="/restaurants" className="hover:text-[#DA291C]">Trouver votre restaurant</Link>
          </div>
        </div>
      </div>

      {/* HEADER GLOBALE FRANCHISE */}
      <header className="sticky top-0 w-full z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="bg-[#DA291C] text-white py-1 px-4 text-[10px] sm:text-xs font-black uppercase text-center tracking-[0.2em] relative overflow-hidden group">
           <div className="relative z-10">{globalConfig?.promoText || "-20% SUR LE MENU XL AVEC LE CODE GASTRO20"}</div>
           <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-transparent to-red-600 opacity-20 animate-pulse"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-900" onClick={() => setIsMobileMenuOpen(true)}>
              <MenuIcon className="w-8 h-8 font-black" />
            </button>
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-[#DA291C] p-2 sm:p-3 rounded-lg shadow-sm">
                 <span className="font-black text-2xl sm:text-3xl text-[#FFC72C] leading-none tracking-tighter">G.</span>
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="font-black text-xl tracking-tight leading-none text-[#DA291C] uppercase truncate max-w-[120px]">{globalConfig?.brandName || 'La Gastronomie'}</span>
                {selectedPOS && (
                  <button onClick={() => setIsPOSModalOpen(true)} className="flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#DA291C] transition-colors">
                    <MapPin className="w-2 h-2" /> {selectedPOS.name}
                  </button>
                )}
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-2 font-bold text-[15px]">
            <Link to="/menu" className={`px-4 py-2.5 rounded-xl transition-colors ${location.pathname === '/menu' ? 'bg-[#FFC72C] text-[#DA291C]' : 'text-gray-700 hover:bg-gray-100'}`}>Carte</Link>
            <Link to="/restaurants" className={`px-4 py-2.5 rounded-xl transition-colors ${location.pathname === '/restaurants' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 flex items-center gap-2'}`}>Points de Vente <MapPin className="w-4 h-4 text-[#DA291C]"/></Link>
            <Link to="/tracking" className={`px-4 py-2.5 rounded-xl transition-colors ${location.pathname === '/tracking' ? 'bg-[#DA291C] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 flex items-center gap-2'}`}>Suivi <Navigation className="w-4 h-4 text-[#DA291C]"/></Link>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <a href={`tel:${currentCountry.phone.replace(/\s/g, '')}`} className="hidden lg:flex bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-xl font-extrabold transition-colors items-center gap-2 shadow-sm">
              <Phone className="w-5 h-5"/> <span className="hidden xl:inline">Appeler</span>
            </a>
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="hidden lg:flex bg-[#25D366] hover:bg-[#1DA851] text-white px-4 py-3 rounded-xl font-extrabold transition-colors items-center gap-2 shadow-sm border-b-[3px] border-[#1DA851] active:border-b-0 active:translate-y-[3px]">
              <MessageCircle className="w-5 h-5"/> <span className="hidden xl:inline">WhatsApp</span>
            </a>
            <button 
              onClick={() => { getCartCount() > 0 ? setIsCartOpen(true) : window.location.href='/menu'; }}
              className="hidden sm:flex bg-[#DA291C] hover:bg-red-700 text-white px-5 py-3 rounded-xl font-extrabold transition-colors items-center gap-3 shadow-[0_4px_15px_rgba(218,41,28,0.3)] border-b-[3px] border-red-900 active:border-b-0 active:translate-y-[3px]"
            >
              <ShoppingBag className="w-6 h-6 stroke-[2.5]" /> 
              {getCartCount() > 0 ? (
                <div className="flex flex-col text-left leading-none">
                  <span className="text-xs text-red-200 uppercase tracking-widest">{getCartCount()} Article(s)</span>
                  <span className="text-lg">{formatPriceC(getCartTotal())}</span>
                </div>
              ) : (
                <span className="uppercase tracking-wide">Commander</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: "-100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm">
               <div className="flex items-center gap-3">
                 <div className="bg-[#DA291C] p-2 rounded-lg">
                    <span className="font-black text-2xl text-[#FFC72C] leading-none">G.</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="font-black text-xl text-[#DA291C] uppercase tracking-tight">La Gastronomie</span>
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{currentCountry.name}</span>
                 </div>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-900"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-24">
              {/* Mobile Country Switcher */}
              <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                 <div>
                   <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-1">Votre Pays</span>
                   <button onClick={handleCountrySwitch} className="font-black text-sm text-gray-900 flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 uppercase tracking-widest leading-none">
                     {currentCountry.flag} {currentCountry.name}
                   </button>
                 </div>
                 <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Resto Sélectionné</span>
                    <button onClick={() => { setIsMobileMenuOpen(false); setIsPOSModalOpen(true); }} className="font-black text-sm text-[#DA291C] flex items-center gap-1 justify-end">
                      <MapPin className="w-3 h-3" /> {selectedPOS?.name || "Choisir un resto"}
                    </button>
                 </div>
              </div>

              <div className="p-6 bg-[#FFC72C] text-[#DA291C] flex justify-between items-center">
                 <div>
                   <h3 className="font-extrabold text-xl mb-1">Affamé ?</h3>
                   <p className="font-bold text-sm text-red-800">Commandez en un instant.</p>
                 </div>
                 <UtensilsCrossed className="w-10 h-10 opacity-50" />
              </div>
              
              <div className="flex flex-col font-extrabold text-2xl text-gray-900">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="p-6 border-b border-gray-100 flex justify-between items-center">Accueil <ChevronRight className="w-6 h-6 text-gray-300"/></Link>
                <Link to="/menu" onClick={() => setIsMobileMenuOpen(false)} className="p-6 border-b border-gray-100 flex justify-between items-center text-[#DA291C]">Voir la Carte <ChevronRight className="w-6 h-6 text-[#DA291C]"/></Link>
                <Link to="/tracking" onClick={() => setIsMobileMenuOpen(false)} className="p-6 border-b border-gray-100 flex justify-between items-center">Suivi de Commande <ChevronRight className="w-6 h-6 text-gray-300"/></Link>
                <Link to="/restaurants" onClick={() => setIsMobileMenuOpen(false)} className="p-6 border-b border-gray-100 flex justify-between items-center">Drive & Restos <ChevronRight className="w-6 h-6 text-gray-300"/></Link>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 mt-auto">
              <button onClick={() => { setIsMobileMenuOpen(false); setIsCartOpen(true); }} className="w-full bg-[#DA291C] text-white py-4 rounded-xl flex justify-center items-center gap-2 font-extrabold text-xl shadow-[0_10px_20px_rgba(218,41,28,0.3)] border-b-[5px] border-red-900 active:border-b-0 active:translate-y-[5px]">
                <ShoppingBag className="w-6 h-6" /> Mon Panier
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full relative z-10">
        {children}
      </main>

      {/* RETAIL FOOTER */}
      <footer className="bg-gray-900 text-white pt-16 pb-32 sm:pb-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="bg-[#DA291C] p-3 rounded-lg inline-block mb-6">
                 <span className="font-black text-3xl text-[#FFC72C] leading-none tracking-tighter">G.</span>
              </div>
              <p className="text-gray-400 font-bold mb-4">Le leader incontesté de la restauration rapide (QSR) avec La Gastronomie {currentCountry.name}.</p>
            </div>
            
            <div>
               <h4 className="font-black text-xl mb-6 text-white">Notre Carte</h4>
               <ul className="space-y-4 font-bold text-gray-400">
                 <li><Link to="/menu" className="hover:text-white transition-colors">Tous les Menus</Link></li>
                 <li><Link to="/menu" className="hover:text-white transition-colors">Kids Box Jouets</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="font-black text-xl mb-6 text-white">L'Entreprise</h4>
               <ul className="space-y-4 font-bold text-gray-400">
                 <li><Link to="/a-propos" className="hover:text-white transition-colors">À Propos de nous</Link></li>
                 <li><Link to="/restaurants" className="hover:text-white transition-colors">Localiser un Drive</Link></li>
                 <li><Link to="/recrutement" className="hover:text-white transition-colors">Recrutement</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="font-black text-xl mb-6 text-white">Vos Commandes</h4>
               <div className="flex flex-col gap-3">
                 <Link to="/tracking" className="bg-white text-gray-900 px-4 py-3 rounded-xl font-black text-left flex items-center gap-3 hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-lg border-b-[4px] border-gray-300">
                   <div className="bg-[#DA291C] text-white p-2 rounded-lg">
                      <Navigation className="w-6 h-6"/>
                   </div>
                   <div className="flex flex-col leading-tight">
                     <span className="text-[10px] font-bold text-gray-500 uppercase">En temps réel</span>
                     <span className="text-lg">Suivre la livraison</span>
                   </div>
                 </Link>
               </div>
            </div>
          </div>
        </div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 font-bold text-sm">
           <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
              <Link to="/politique-de-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link>
              <Link to="/conditions-utilisation" className="hover:text-white transition-colors">CGV & CGU</Link>
              <Link to="/politique-cookies" className="hover:text-white transition-colors">Cookies</Link>
              <Link to="/politique-livraison" className="hover:text-white transition-colors">Politique de livraison</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Support & Contact</Link>
           </div>
           <p>© {new Date().getFullYear()} La Gastronomie Pizza. Tous droits réservés.</p>
         </div>
      </footer>

      {/* STEP 2 : THE REAL CART DRAWER (VALIDATION) */}
      <AnimatePresence>
        {isCartOpen && <CartDrawer onClose={() => setIsCartOpen(false)} />}
      </AnimatePresence>

      {/* STICKY BOTTOM BAR (Desktop Cart Trigger) */}
      <AnimatePresence>
        {getCartCount() > 0 && !selectedProduct && !isCartOpen && (
          <motion.div 
            initial={{ y: 150 }} animate={{ y: 0 }} exit={{ y: 150 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="hidden sm:flex fixed bottom-6 right-6 z-40 px-0 justify-end"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="min-w-[340px] bg-[#DA291C] text-white p-3 rounded-[1.25rem] shadow-[0_20px_40px_rgba(218,41,28,0.4)] flex items-center justify-between hover:scale-105 transition-all border-b-[6px] border-red-900 active:translate-y-[6px] active:border-b-0 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                 <motion.div key={getCartCount()} initial={{ scale: 0.8, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }} className="bg-[#FFC72C] text-[#DA291C] w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl shadow-inner border-2 border-yellow-300">
                   {getCartCount()}
                 </motion.div>
                 <div className="flex flex-col text-left">
                   <span className="font-black text-xl leading-none text-white tracking-tight uppercase group-hover:text-[#FFC72C] transition-colors">Voir mon panier</span>
                   <span className="font-extrabold text-sm text-yellow-300">Valider & Payer</span>
                 </div>
              </div>
              <div className="flex items-center gap-3 pl-4 pr-2">
                <span className="font-black text-[22px] tracking-tight text-white">{formatPriceC(getCartTotal())}</span>
                <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform"/>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APP-LIKE BOTTOM NAVIGATION BAR (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white border-t border-gray-100 flex justify-around items-center pt-2 pb-safe" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <Link to="/" className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location.pathname === '/' ? 'text-[#DA291C]' : 'text-gray-400'}`}>
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Accueil</span>
        </Link>
        <Link to="/menu" className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location.pathname === '/menu' ? 'text-[#DA291C]' : 'text-gray-400'}`}>
          <UtensilsCrossed className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Menu</span>
        </Link>
        
        {/* Floating Cart Button */}
        <div className="relative -top-6">
          <button onClick={() => { getCartCount() > 0 ? setIsCartOpen(true) : window.location.href='/menu'; }} className="bg-[#DA291C] text-white rounded-full p-4 shadow-[0_8px_20px_rgba(218,41,28,0.4)] flex items-center justify-center relative active:scale-95 transition-transform">
             {getCartCount() > 0 && (
              <span className="absolute top-0 right-0 translate-x-[20%] -translate-y-[20%] bg-[#FFC72C] text-[#DA291C] text-[10px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {getCartCount()}
              </span>
            )}
             <ShoppingBag className="w-6 h-6" />
          </button>
        </div>

        <Link to="/tracking" className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location.pathname === '/tracking' ? 'text-[#DA291C]' : 'text-gray-400'}`}>
          <Navigation className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Suivi</span>
        </Link>
        <Link to="/restaurants" className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location.pathname === '/restaurants' ? 'text-[#DA291C]' : 'text-gray-400'}`}>
          <MapPin className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">Drive</span>
        </Link>
      </div>

      {/* PRODUCT DETAIL MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {lastAdded && (
          <motion.div 
            key={lastAdded}
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }} 
            exit={{ opacity: 0, y: -20, scale: 0.8, x: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-28 sm:top-32 left-1/2 z-[60] bg-gray-900/95 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center gap-4 border-[3px] border-gray-700 pointer-events-none min-w-[280px]"
          >
             <div className="bg-[#FFC72C] text-[#DA291C] rounded-full p-1.5 shadow-inner border border-yellow-300">
               <ShoppingBag className="w-5 h-5"/>
             </div>
             <div className="flex flex-col">
               <span className="font-black text-sm uppercase tracking-wide">Panier mis à jour</span>
               <span className="font-bold text-gray-400 text-xs">{lastAdded} ajouté avec succès</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <POSSelectionModal isOpen={isPOSModalOpen} onClose={() => setIsPOSModalOpen(false)} />
      
      {/* STICKY BOTTOM CTAs (Mobile-First Conversion) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-2">
         <Link to="/menu" className="flex-1 bg-[#DA291C] text-white py-4 rounded-2xl font-black uppercase text-center text-xs tracking-widest shadow-lg shadow-red-200">
            Commander
         </Link>
         <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white p-4 rounded-2xl shadow-lg shadow-green-100">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.431 5.63 1.432h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
         </a>
         <a href={`tel:${whatsappNumber?.replace(/\s/g, '')}`} className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg shadow-gray-200">
            <Phone className="w-5 h-5" />
         </a>
      </div>
    </div>
  );
}

function POSSelectionModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { globalPOS, selectedPOS, setSelectedPOS, userCoords } = useCart();
  
  const sortedPOS = [...globalPOS].sort((a, b) => {
    if (!userCoords || a.lat === undefined || b.lat === undefined) return 0;
    const distA = Math.sqrt(Math.pow(a.lat - userCoords.lat, 2) + Math.pow(a.lng - userCoords.lng, 2));
    const distB = Math.sqrt(Math.pow(b.lat - userCoords.lat, 2) + Math.pow(b.lng - userCoords.lng, 2));
    return distA - distB;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 pb-4">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">Choisir mon resto</h2>
              <p className="text-gray-500 font-bold text-sm mb-6 uppercase tracking-widest">Le service est optimisé pour votre emplacement actuel.</p>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {sortedPOS.map((pos: any, idx: number) => {
                  const hasCoords = pos.lat !== undefined && pos.lng !== undefined;
                  const dist = (userCoords && hasCoords) ? Math.round(Math.sqrt(Math.pow(pos.lat - userCoords.lat, 2) + Math.pow(pos.lng - userCoords.lng, 2)) * 111) : null;
                  const isNearest = idx === 0 && userCoords && hasCoords;
                  
                  return (
                    <button 
                      key={pos.id} 
                      onClick={() => { setSelectedPOS(pos); onClose(); }}
                      className={`w-full p-4 rounded-[2rem] border-2 transition-all flex flex-col items-start gap-1 relative overflow-hidden ${selectedPOS?.id === pos.id ? 'border-[#DA291C] bg-red-50/50' : 'border-gray-100 hover:border-[#FFC72C] bg-white'}`}
                    >
                      {isNearest && <span className="absolute top-0 right-0 bg-[#FFC72C] text-[#DA291C] px-3 py-1 font-black text-[10px] rounded-bl-xl uppercase tracking-tighter shadow-sm">À proximité !</span>}
                      <span className="font-black text-lg text-gray-900 flex items-center gap-2">
                        {pos.name}
                        {selectedPOS?.id === pos.id && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </span>
                      <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 line-clamp-1 text-left">
                        <MapPin className="w-3 h-3 text-[#DA291C]" /> {pos.address}
                      </span>
                      {dist !== null && <span className="text-[10px] font-black text-[#DA291C] uppercase tracking-widest mt-1">À environ {dist} km de vous</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
               <button onClick={onClose} className="font-black text-xs text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Rester sur le site</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- NEW COMPONENT: CART DRAWER (STEP 2 - VALIDATION) ---
function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, getCartTotal, updateQuantity, removeFromCart, clearCart, formatPriceC, addToCart, setActiveOrder, whatsappLink, whatsappNumber, globalConfig, selectedPOS, isLoggedIn } = useCart();
  const navigate = useNavigate();
  const [orderMode, setOrderMode] = useState<'livraison' | 'emporter'>('emporter');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryCoords, setDeliveryCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const { add: addOrder } = useFirestore('orders'); // Real-time order syncer

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
       const lat = position.coords.latitude;
       const lng = position.coords.longitude;
       setDeliveryCoords({ lat, lng });
       try {
         const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
         const data = await res.json();
         if (data && data.display_name) {
            setAddress(data.display_name);
            setAddressError('');
         }
       } catch (err) {
         console.error(err);
         alert("Position trouvée, mais impossible d'obtenir l'adresse texte.");
       } finally {
         setIsLocating(false);
       }
    }, (error) => {
       setIsLocating(false);
       alert("Impossible d'obtenir votre position. Veuillez entrer l'adresse manuellement.");
    });
  };

  // Step 3 - Transmission : Simulate server processing, then go to tracking.
  const handleFinalCheckout = async () => {
    if (cart.length === 0) return;
    
    // Validate Form Details
    if (!customerName.trim()) {
      alert("Veuillez saisir votre nom pour valider la commande.");
      return;
    }
    if (!selectedPOS) {
      alert("Veuillez sélectionner un point de vente avant de commander.");
      return;
    }
    if (orderMode === 'livraison' && !address.trim()) {
      setAddressError("Veuillez saisir votre adresse de livraison.");
      return;
    } else {
      setAddressError('');
    }

    setIsProcessing(true);
    
    const generatedId = 'CMD-' + Math.floor(1000 + Math.random() * 9000);
    
    // Default initial status
    let initialStatus = 'pending';
    if (globalConfig?.customStatuses && globalConfig.customStatuses.length > 0) {
       initialStatus = globalConfig.customStatuses[0].id;
    }

    const newOrderData: any = {
       id: generatedId, // Keep for old apps
       orderNumber: generatedId,
       status: initialStatus,
       total: getCartTotal(),
       items: [...cart], // clone to keep items
       orderMode: orderMode,
       posId: selectedPOS?.id?.toString() || 'unknown',
       posName: selectedPOS?.name || 'Restaurant inconnu',
       address: address || 'Antananarivo, Centre',
       customerName: customerName || 'Client',
       etaMinutes: 25,
       timestamp: Date.now()
    };
    if (deliveryCoords) newOrderData.deliveryCoords = deliveryCoords;
    if (isLoggedIn && auth.currentUser) newOrderData.userId = auth.currentUser.uid;
    
    // Add to Firestore
    try {
      const sanitizedOrder = JSON.parse(JSON.stringify(newOrderData));
      const orderId = await addOrder(sanitizedOrder);
      const finalOrder = { ...newOrderData, id: orderId };
      setActiveOrder(finalOrder);
      
      clearCart();
      setIsProcessing(false);
      onClose();
      navigate('/tracking');
    } catch (e) {
      console.error("Firebase err:", e);
      setIsProcessing(false);
      alert("Erreur lors de l'envoi de la commande. Veuillez réessayer.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-gray-50 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-gray-200">
           <h2 className="font-black text-2xl uppercase tracking-tight text-gray-900 flex items-center gap-2">
             <ShoppingBag className="w-6 h-6 text-[#DA291C]" strokeWidth={3} /> Mon Panier
           </h2>
           <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
             <X className="w-5 h-5 text-gray-900 font-bold" />
           </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
               <Package className="w-16 h-16 mb-4 text-gray-300" />
               <p className="font-bold text-xl uppercase tracking-wide">Panier Vide</p>
               <p className="text-sm mt-2">Dépêchez-vous, nos frites n'attendent pas !</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Items */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                    <img src={item.product.image} className="w-20 h-20 bg-gray-50 rounded-xl object-contain p-1" alt={item.product.name} />
                    <div className="flex-1 flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                         <div>
                           <h4 className="font-black text-gray-900 leading-tight uppercase text-sm">{item.product.name}</h4>
                           <p className="text-[#DA291C] font-black text-sm mt-1">{formatPriceC(item.product.price)}</p>
                         </div>
                         <button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-5 h-5"/></button>
                       </div>
                       <div className="flex justify-between items-end mt-2">
                          <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 hover:text-[#DA291C]"><Minus className="w-4 h-4 stroke-[3]"/></button>
                            <span className="font-black w-4 text-center text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 hover:text-[#DA291C]"><Plus className="w-4 h-4 stroke-[3]"/></button>
                          </div>
                          <span className="font-black text-gray-900">{formatPriceC(item.product.price * item.quantity)}</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upsell / Cross-sell */}
              <div className="bg-gray-900 rounded-2xl p-5 overflow-hidden relative mt-6">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC72C] rounded-full blur-[40px] opacity-20 -mr-10 -mt-10"></div>
                 <h3 className="font-black uppercase text-white mb-3 text-sm tracking-widest relative z-10 flex items-center gap-2"><Star className="w-4 h-4 text-[#FFC72C] fill-[#FFC72C]"/> Complétez votre repas</h3>
                 <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1 relative z-10">
                   {[
                     { id: 'u1', name: "Coca-Cola 50cl", description: "Boisson fraîche", price: 3000, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80", categoryId: '5' },
                     { id: 'u2', name: "Frites XL", description: "Portion généreuse", price: 2500, img: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300&q=80", categoryId: '1' }
                   ].map((upsell, i) => (
                     <div key={i} onClick={() => addToCart({id: upsell.id, name: upsell.name, description: upsell.description, price: upsell.price, image: upsell.img, categoryId: upsell.categoryId, badge: '', popular: false}, 1)} className="bg-white/10 border border-white/20 rounded-xl p-3 shrink-0 w-[140px] flex flex-col items-center cursor-pointer hover:bg-white/20 transition-all backdrop-blur-sm">
                       <img src={upsell.img} alt={upsell.name} className="w-16 h-16 object-cover rounded-lg mb-3 shadow-md" />
                       <span className="font-bold text-xs text-center text-white mb-1 line-clamp-1">{upsell.name}</span>
                       <span className="font-black text-[#FFC72C] text-xs">+{formatPriceC(upsell.price)}</span>
                     </div>
                   ))}
                 </div>
              </div>

              {/* Order Settings Form */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mt-6">
                 <h3 className="font-black uppercase text-gray-900 mb-4 text-sm tracking-widest">Options de la commande</h3>
                 
                 <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
                   <button 
                     onClick={() => setOrderMode('emporter')}
                     className={`py-2 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wide transition-all ${orderMode === 'emporter' ? 'bg-white shadow-sm text-[#DA291C]' : 'text-gray-500'}`}
                   >
                     À emporter
                   </button>
                   <button 
                     onClick={() => setOrderMode('livraison')}
                     className={`py-2 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wide transition-all ${orderMode === 'livraison' ? 'bg-white shadow-sm text-[#DA291C]' : 'text-gray-500'}`}
                   >
                     Livraison
                   </button>
                 </div>

                 <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Votre Prénom*" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold placeholder-gray-400 outline-none focus:border-[#FFC72C] focus:bg-white transition-colors"
                    />
                    {orderMode === 'livraison' && (
                      <div className="space-y-3">
                        <button 
                           onClick={handleGeolocate} 
                           type="button"
                           disabled={isLocating}
                           className="w-full flex items-center justify-center gap-2 bg-[#DA291C]/10 text-[#DA291C] hover:bg-[#DA291C]/20 border border-[#DA291C]/20 p-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all"
                        >
                           <MapPin className="w-4 h-4" />
                           {isLocating ? 'Recherche en cours...' : 'Utiliser ma position actuelle'}
                        </button>
                        <div className="flex items-center gap-4">
                           <hr className="flex-1 border-gray-200" />
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OU SAISIR</span>
                           <hr className="flex-1 border-gray-200" />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Adresse Complète de Livraison*" 
                          value={address}
                          onChange={(e) => { setAddress(e.target.value); setAddressError(''); }}
                          className={`w-full bg-gray-50 border ${addressError ? 'border-red-500 bg-red-50' : 'border-gray-200'} p-3 rounded-xl text-sm font-bold placeholder-gray-400 outline-none focus:border-[#FFC72C] focus:bg-white transition-colors`}
                        />
                        {addressError && <p className="text-red-500 font-bold text-xs mt-1 px-1">{addressError}</p>}
                      </div>
                    )}
                 </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Checkout */}
        {cart.length > 0 && (
          <div className="bg-white border-t border-gray-200 p-4 sm:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] shrink-0">
             <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-500">Total net</span>
                <span className="font-black text-2xl text-gray-900">{formatPriceC(getCartTotal())}</span>
             </div>
             
             <button 
               disabled={globalConfig?.isRestaurantOpen === false}
               onClick={() => {
                  if (globalConfig?.isRestaurantOpen === false) return;
                  if (!customerName.trim()) {
                    alert("Veuillez saisir votre pseudo/nom pour la commande.");
                    return;
                  }
                  if (orderMode === 'livraison' && !address.trim()) {
                    setAddressError("Veuillez saisir votre adresse de livraison.");
                    return;
                  }
                  
                  let message = `*🔴 NOUVELLE COMMANDE LA GASTRONOMIE*\n\n`;
                  message += `*Mode :* ${orderMode === 'livraison' ? '🛵 Livraison' : '🏃‍♂️ À emporter'}\n`;
                  if (customerName) message += `*Nom :* ${customerName}\n`;
                  if (orderMode === 'livraison' && address) message += `*Adresse :* ${address}\n`;
                  
                  message += `\n*--- DÉTAIL DE LA COMMANDE ---*\n`;
                  cart.forEach(item => {
                    message += `🍔 ${item.quantity}x ${item.product.name} (${formatPriceC(item.product.price * item.quantity)})\n`;
                    if (item.instructions) message += `   ↳ _Note: ${item.instructions}_\n`;
                  });
                  
                  message += `\n*--- RÉCAPITULATIF ---*\n`;
                  message += `*Total à payer :* *${formatPriceC(getCartTotal() + (orderMode === 'livraison' ? (globalConfig?.deliveryFee || 0) : 0))}*\n\n`;
                  message += `Merci de valider ma commande ! 👍`;
                  
                  const baseUrl = `https://wa.me/${whatsappNumber.replace(/\s+/g, '')}`;
                  window.open(`${baseUrl}?text=${encodeURIComponent(message)}`, '_blank');
                  
                  handleFinalCheckout();
               }}
               className={`w-full py-4 rounded-[1.25rem] font-black text-lg uppercase flex items-center justify-center gap-3 transition-all ${globalConfig?.isRestaurantOpen === false ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-[#25D366] text-white hover:bg-[#1DA851] shadow-[0_10px_20px_rgba(37,211,102,0.3)] hover:scale-[1.02] active:scale-95 border-b-[5px] border-[#188c43] active:border-b-0 active:translate-y-[5px]'}`}
             >
                {globalConfig?.isRestaurantOpen === false ? (
                  <>Le Restaurant est Fermé</>
                ) : (
                  <><MessageCircle className="w-6 h-6 border-2 border-white rounded-full p-0.5" /> Commander sur WhatsApp</>
                )}
             </button>
             
             {globalConfig?.isRestaurantOpen === false ? (
               <p className="text-center text-xs font-bold text-red-500 mt-4 leading-tight">
                 Le service de commande en ligne est momentanément suspendu.
               </p>
             ) : (
               <p className="text-center text-xs font-bold text-gray-400 mt-4 leading-tight">
                 Vous finaliserez le paiement et le suivi de commande de manière sécurisée en direct via WhatsApp.
               </p>
             )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// --- HOME & MENU PAGES COMBINED RENDER (Kept exact franchise vibe) ---
function PromoBanner({ globalConfig }: { globalConfig: any }) {
   if (!globalConfig?.promoActive || !globalConfig?.promoText) return null;
   return (
      <div className="bg-[#FFC72C] text-gray-900 font-black uppercase tracking-widest text-xs sm:text-sm py-3 px-4 text-center shadow-md relative z-50 overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
         <span className="relative z-10 flex items-center justify-center gap-2">
            <Star className="w-4 h-4 fill-current"/>
            {globalConfig.promoText}
            <Star className="w-4 h-4 fill-current"/>
         </span>
      </div>
   );
}

function PageHome() {
  const { globalProducts: products, globalCategories: categories, globalConfig } = useCart();
  const heroProduct = products.length > 0 ? products[0] : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white pb-12">
      <PromoBanner globalConfig={globalConfig} />
      
      {/* MASSIVE PROMO HERO */}
      <div className="bg-gradient-to-br from-[#DA291C] to-[#99140d] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FFC72C] rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 md:py-24 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16">
           <div className="flex-1 text-center md:text-left z-20">
             <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#FFC72C] text-[#DA291C] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-sm inline-block mb-6 shadow-xl border-2 border-[#FFC72C]/50">Édition Limitée</motion.span>
             <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-black text-6xl md:text-8xl lg:text-[9rem] leading-[0.85] tracking-tighter mb-6 uppercase text-white drop-shadow-2xl">{globalConfig?.heroTitle1 || 'Méga'}<br/><span className="text-[#FFC72C] filter drop-shadow-md">{globalConfig?.heroTitle2 || 'Gastro'}</span></motion.h1>
             <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="font-bold text-lg md:text-2xl text-red-50 mb-8 max-w-lg mx-auto md:mx-0 drop-shadow-sm">{globalConfig?.heroSubtitle || "Le burger le plus attendu de l'année. Double viande, double fromage fondu. Ça va être énorme."}</motion.p>
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
               <Link to="/menu" className="inline-block bg-[#FFC72C] text-[#DA291C] px-8 py-4 rounded-2xl font-black text-xl hover:bg-yellow-400 transition-all shadow-[0_10px_30px_rgba(255,199,44,0.4)] border-b-[6px] border-yellow-600 hover:border-b-[4px] hover:translate-y-[2px] active:border-b-0 active:translate-y-[6px]">Je le veux !</Link>
             </motion.div>
           </div>
           {heroProduct && (
             <div className="flex-1 w-full max-w-md relative z-10">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-gradient-to-r from-[#FFC72C] to-orange-400 rounded-full blur-[80px] opacity-30 z-0"></div>
                <motion.img 
                  animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }} 
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  src={heroProduct.image} alt="Mega Burger" className="w-full relative z-10 filter drop-shadow-2xl scale-110 sm:scale-125 hover:scale-150 transition-transform duration-700 cursor-pointer" 
                />
             </div>
           )}
        </div>
      </div>

      {/* INFINITE MARQUEE */}
      <div className="bg-gray-900 overflow-hidden py-3 border-y-[4px] border-[#FFC72C]">
         <motion.div 
           animate={{ x: ["0%", "-50%"] }} 
           transition={{ ease: "linear", duration: 15, repeat: Infinity }}
           className="flex whitespace-nowrap gap-8 text-[#FFC72C] font-black uppercase tracking-widest text-lg items-center"
         >
            <span>🍔 Double Viande</span>
            <span className="text-white">•</span>
            <span>🔥 Edition Limitée</span>
            <span className="text-white">•</span>
            <span>🍟 Frites XL Offertes</span>
            <span className="text-white">•</span>
            <span>🛵 Livraison Express</span>
            <span className="text-white">•</span>
            <span>🍔 Double Viande</span>
            <span className="text-white">•</span>
            <span>🔥 Edition Limitée</span>
            <span className="text-white">•</span>
            <span>🍟 Frites XL Offertes</span>
            <span className="text-white">•</span>
            <span>🛵 Livraison Express</span>
         </motion.div>
      </div>

      {/* QUICK CATEGORIES */}
      <section className="py-10 sm:py-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight text-center mb-6 sm:mb-10 text-gray-900">Tu as envie de quoi ?</h2>
           <div className="flex overflow-x-auto sm:grid sm:grid-cols-6 gap-3 sm:gap-4 pb-4 sm:pb-0 hide-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.slice(0, 6).map(cat => (
                <Link to="/menu" key={cat.id} className={`${cat.color || 'bg-gray-100'} rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform shadow-sm border border-black/5 min-w-[110px] shrink-0 snap-center`}>
                   {cat.icon?.startsWith('http') || cat.icon?.startsWith('data:image') ? (
                     <img src={cat.icon} alt={cat.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md" />
                   ) : (
                     <span className="text-4xl sm:text-5xl drop-shadow-md">{cat.icon || '🍔'}</span>
                   )}
                   <span className={`font-black text-[11px] sm:text-sm uppercase text-center ${cat.text || 'text-gray-700'} leading-tight`}>{cat.name}</span>
                </Link>
              ))}
           </div>
        </div>
      </section>
      {/* SWIPE MENU (THE HITS) */}
      <section className="py-10 sm:py-16 bg-gray-50 border-t border-gray-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="font-black text-2xl sm:text-4xl uppercase tracking-tight text-gray-900 flex items-center gap-2 sm:gap-3">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-[#FFC72C] fill-[#FFC72C]" /> Nos Incontournables
            </h2>
            <Link to="/menu" className="hidden sm:inline-flex items-center gap-1 font-bold text-[#DA291C] hover:text-red-800">Voir tout le menu <ChevronRight className="w-5 h-5"/></Link>
          </div>
          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth snap-x snap-mandatory">
             {products.filter(p => p.popular).slice(0, 6).map(product => (
                <div key={product.id} className="w-[75vw] max-w-[260px] sm:max-w-none sm:w-[320px] shrink-0 snap-center">
                  <ProductCard product={product} />
                </div>
             ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function PageMenu() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { globalProducts: products, globalCategories: categories } = useCart();
  const isLoading = products.length === 0 && categories.length === 0;

  const filteredProducts = products.filter((p: any) => p.isAvailable !== false).filter((p: any) => {
    if (searchQuery.trim() !== '') {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (activeCategory === 'all') return true;
    return p.categoryId === activeCategory;
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      <div className="bg-white/90 backdrop-blur-xl sticky top-[68px] sm:top-[85px] z-30 shadow-sm border-b border-gray-200">
        {/* Make PromoBanner sit above the category tabs in menu */}
        <PromoBanner globalConfig={categories.length > 0 ? useCart().globalConfig : null} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto hide-scrollbar gap-3 py-4">
            <button 
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }} 
              className={`flex flex-col items-center justify-center gap-2 w-[104px] h-[88px] rounded-[1.25rem] transition-all outline-none border-2 shrink-0 ${activeCategory === 'all' && !searchQuery ? 'bg-[#FFC72C] border-yellow-400 text-gray-900 shadow-md transform scale-105' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200'}`}
            >
              <span className="text-3xl filter drop-shadow-sm">🍽️</span>
              <span className="font-black text-[10px] uppercase tracking-wider text-center leading-tight whitespace-pre-wrap">Tous</span>
            </button>
            {categories.map((cat: any) => (
                <button 
                  key={cat.id} 
                  onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }} 
                  className={`flex flex-col items-center justify-center gap-2 w-[104px] h-[88px] rounded-[1.25rem] transition-all outline-none border-2 shrink-0 ${activeCategory === cat.id && !searchQuery ? 'bg-[#FFC72C] border-yellow-400 text-gray-900 shadow-md transform scale-105' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200'}`}
                >
                  {cat.icon?.startsWith('http') || cat.icon?.startsWith('data:image') ? (
                    <img src={cat.icon} alt={cat.name} className="w-8 h-8 object-contain drop-shadow-sm" />
                  ) : (
                    <span className="text-3xl filter drop-shadow-sm">{cat.icon || '🍔'}</span>
                  )}
                  <span className="font-black text-[10px] uppercase tracking-wider text-center leading-tight whitespace-pre-wrap">{cat.name}</span>
                </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Search Bar */}
        <div className="mb-8 relative max-w-xl">
           <input 
             type="text" 
             placeholder="Rechercher un burger, une pizza..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-white border-2 border-gray-200 p-4 pl-12 rounded-2xl font-bold text-gray-900 placeholder-gray-400 focus:border-[#DA291C] focus:ring-4 focus:ring-red-50 outline-none transition-all shadow-sm"
           />
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
             <Search className="w-6 h-6"/> 
           </div>
        </div>

        <h1 className="font-black text-4xl uppercase tracking-tight text-gray-900 mb-8 border-l-8 border-[#DA291C] pl-4">
          {searchQuery ? 'Résultats de recherche' : CATEGORIES.find(c => c.id === activeCategory)?.name}
        </h1>
        
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-8 border-gray-100 border-t-[#DA291C] rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">Chargement du Menu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
           <div className="py-20 text-center">
             <span className="text-6xl mb-4 block">🥺</span>
             <h3 className="font-black text-2xl text-gray-900 mb-2">Aucun résultat</h3>
             <p className="font-bold text-gray-500">Nous n'avons pas trouvé ce que vous cherchez.</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} key={product.id}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function PageLoyalty() {
  const { formatPriceC, isLoggedIn, setIsLoggedIn, activeOrder } = useCart();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFakeLogin = () => {
    setIsLoggingIn(true);
    setLoginError(null);
    simulateApiCall(true, 0.4, 1500)
      .then(() => {
        setIsLoggedIn(true);
        setIsLoggingIn(false);
      })
      .catch(err => {
        setLoginError("Impossible de se connecter au serveur d'authentification. Veuillez réessayer.");
        setIsLoggingIn(false);
      });
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-white min-h-screen pb-32 flex flex-col relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FFC72C] rounded-full blur-[100px] opacity-20 z-0"></div>
        
        <div className="flex-1 max-w-md mx-auto w-full px-6 pt-16 pb-8 relative z-10 flex flex-col">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-[#DA291C] to-red-700 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/30 transform rotate-3">
              <Star className="w-10 h-10 fill-[#FFC72C] text-[#FFC72C]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-gray-900 mb-3">Le G. Club</h1>
            <p className="font-bold text-gray-500 text-lg">Rejoignez l'élite. Gagnez des points. Mangez gratuit.</p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 mb-10 shadow-sm">
             <ul className="space-y-5">
               {[
                 { icon: <Gift className="w-6 h-6 text-[#DA291C]" />, title: 'Points sur chaque achat', desc: '1€ dépensé = 10 G-Points.' },
                 { icon: <Star className="w-6 h-6 text-[#FFC72C]" />, title: 'Récompenses exclusives', desc: 'Débloquez des frites et burgers gratuits.' },
                 { icon: <Heart className="w-6 h-6 text-pink-500" />, title: 'Surprise d\'anniversaire', desc: 'Un menu offert pour fêter ça !' },
               ].map((ben, i) => (
                 <li key={i} className="flex gap-4">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                     {ben.icon}
                   </div>
                   <div>
                     <h4 className="font-black text-gray-900">{ben.title}</h4>
                     <p className="font-bold text-gray-500 text-sm leading-tight mt-1">{ben.desc}</p>
                   </div>
                 </li>
               ))}
             </ul>
          </div>

          <div className="mt-auto space-y-4">
            <button 
              onClick={handleFakeLogin} 
              disabled={isLoggingIn}
              className="w-full bg-[#DA291C] text-white py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(218,41,28,0.3)] hover:bg-red-700 transition-all border-b-[4px] border-red-900 active:border-b-0 active:translate-y-[4px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Créer mon compte VIP'
              )}
            </button>
            <button 
              onClick={handleFakeLogin} 
              disabled={isLoggingIn}
              className="w-full bg-white text-gray-900 border-2 border-gray-200 py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center hover:bg-gray-50 transition-all"
            >
               Me connecter
            </button>
            
            {loginError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 font-bold text-sm p-4 rounded-xl text-center border border-red-100 flex items-start gap-3 mt-2">
                 <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                 <p>{loginError}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      <div className="bg-[#DA291C] pt-10 pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
         <div className="max-w-md mx-auto relative z-10 flex justify-between items-center text-white">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">G. Club</h1>
              <p className="font-bold text-red-100 text-sm">Niveau Gold</p>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-md transition-colors">
               <LogOut className="w-5 h-5" />
            </button>
         </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-20 relative z-20">
         {/* THE CARD */}
         <motion.div 
           initial={{ y: 20, opacity: 0 }} 
           animate={{ y: 0, opacity: 1 }} 
           transition={{ type: "spring", stiffness: 200, damping: 20 }}
           className="bg-gray-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden border-4 border-gray-900 group"
         >
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#FFC72C] to-orange-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-10 relative z-10">
               <div>
                 <span className="text-gray-400 font-bold text-xs uppercase tracking-widest block mb-1">Pass VIP</span>
                 <h2 className="text-white font-black text-2xl uppercase tracking-tight">Rachid L.</h2>
               </div>
               <div className="bg-[#DA291C] p-2 rounded-lg shadow-lg">
                 <span className="font-black text-xl text-[#FFC72C] leading-none">G.</span>
               </div>
            </div>

            <div className="mb-8 relative z-10">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-5xl font-black text-white tracking-tighter shadow-lg">1,250<span className="text-lg text-[#FFC72C] ml-1">pts</span></span>
               </div>
               <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden shadow-inner">
                 <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} transition={{ duration: 1, delay: 0.2 }} className="bg-gradient-to-r from-[#FFC72C] to-orange-500 h-full rounded-full relative">
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
                 </motion.div>
               </div>
               <p className="text-gray-400 font-bold text-xs mt-2 text-right">Plus que 250 pts avant votre plat offert</p>
            </div>

            <div className="bg-white p-3 rounded-xl flex items-center justify-between relative z-10 shadow-md">
               <div className="flex-1 flex justify-center py-2 h-16 w-full relative">
                 <div className="absolute inset-0 flex gap-1 items-center justify-center px-4">
                   {[...Array(35)].map((_, i) => (
                     <div key={i} className="bg-gray-900 rounded-sm" style={{ width: Math.random() * 5 + 2 + 'px', height: Math.random() * 80 + 20 + '%' }}></div>
                   ))}
                 </div>
               </div>
               <div className="ml-4 shrink-0 bg-gray-100 p-2 rounded-lg">
                 <QrCode className="w-8 h-8 text-gray-900" />
               </div>
            </div>
         </motion.div>

         {/* ACTIVE ORDER TRACKING IN LOYALTY */}
         {activeOrder && (
           <div className="mt-8 relative z-20">
             <div onClick={() => navigate('/tracking')} className="bg-[#DA291C] text-white p-4 rounded-2xl flex items-center justify-between cursor-pointer shadow-[0_4px_15px_rgba(218,41,28,0.4)] hover:scale-[1.02] active:scale-95 transition-all border-b-[4px] border-red-900 active:border-b-0 active:translate-y-[4px]">
               <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-2 rounded-full"><Bike className="w-6 h-6 text-white"/></div>
                 <div>
                   <h4 className="font-black text-sm uppercase tracking-wider">Commande en cours</h4>
                   <p className="font-bold text-xs text-red-100">Suivi en temps réel</p>
                 </div>
               </div>
               <ChevronRight className="w-5 h-5"/>
             </div>
           </div>
         )}
         
         {/* REWARDS LIST */}
         <div className="mt-8">
            <h3 className="font-black text-xl uppercase tracking-tight text-gray-900 mb-4">Débloquez vos cadeaux</h3>
            <div className="space-y-3">
              {[
                { pts: 500, desc: "Petite Frite Offerte", locked: false, claimable: true },
                { pts: 1500, desc: "Burger Classique Offert", locked: true, claimable: false },
                { pts: 3000, desc: "Menu Maxi Best-Of", locked: true, claimable: false }
              ].map((reward, i) => (
                <div key={i} className={`p-4 rounded-2xl flex items-center gap-4 ${reward.locked ? 'bg-white opacity-60 border border-gray-100' : 'bg-gradient-to-r from-[#FFC72C]/20 to-orange-100 border border-yellow-200'}`}>
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${reward.locked ? 'bg-gray-100 text-gray-400 shadow-inner' : 'bg-[#FFC72C] text-[#DA291C] shadow-md'}`}>
                     {reward.locked ? <Lock className="w-5 h-5" /> : <Star className="w-6 h-6 fill-current" />}
                   </div>
                   <div className="flex-1">
                     <h4 className={`font-black tracking-tight ${reward.locked ? 'text-gray-900' : 'text-gray-900'}`}>{reward.desc}</h4>
                     <p className={`text-sm font-bold ${reward.locked ? 'text-gray-400' : 'text-orange-600'}`}>
                        {reward.pts} points {reward.locked && <span className="ml-1 text-xs">({reward.pts - 1250} restants)</span>}
                     </p>
                   </div>
                   {!reward.locked && (
                     <button 
                       onClick={() => {
                          alert(`Félicitations! Vous avez échangé vos points contre: ${reward.desc}. Retrouvez-le dans votre panier.`);
                          navigate('/menu');
                       }}
                       className="bg-[#DA291C] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-[0_4px_10px_rgba(218,41,28,0.3)] hover:scale-105 transition-transform active:scale-95"
                     >
                       Obtenir
                     </button>
                   )}
                </div>
              ))}
            </div>
         </div>
         
         {/* ACTIVITY */}
         <div className="mt-8 mb-4">
            <h3 className="font-black text-lg uppercase tracking-tight text-gray-900 mb-4">Historique</h3>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
               <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <div>
                    <h5 className="font-black text-gray-900 text-sm">Commande #FR-402</h5>
                    <p className="text-xs font-bold text-gray-400">Hier à 19:30 • Drive Ilafy</p>
                  </div>
                  <span className="font-black text-[#25D366]">+120 pts</span>
               </div>
               <div className="flex justify-between items-center pb-2">
                  <div>
                    <h5 className="font-black text-gray-900 text-sm">Commande #FR-301</h5>
                    <p className="text-xs font-bold text-gray-400">12 Avril • Mada Plateau</p>
                  </div>
                  <span className="font-black text-[#25D366]">+250 pts</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function PageRestaurants() {
  const { country, globalPOS, setSelectedPOS, selectedPOS, userCoords } = useCart();
  const currentCountry = COUNTRIES[country];
  
  const displayRestaurants = globalPOS.filter(r => r.country === country || !r.country);
  const defaultCenter: [number, number] = userCoords ? [userCoords.lat, userCoords.lng] : (displayRestaurants[0] && displayRestaurants[0].lat !== undefined ? [displayRestaurants[0].lat, displayRestaurants[0].lng] : [-18.8792, 47.5079]);

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="bg-[#DA291C] h-48 sm:h-64 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-2 relative z-10">Nos Restaurants</h1>
        <p className="text-red-100 font-black tracking-widest text-xs sm:text-sm uppercase relative z-10">Trouvez le Gastro le plus proche de vous</p>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        
        {/* INTERACTIVE MAP */}
        <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border-4 border-white h-[400px] mb-10 overflow-hidden relative group">
           <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={false} className="w-full h-full rounded-[1.8rem]">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={defaultCenter} zoom={userCoords ? 14 : 11} />
              
              {userCoords && (
                <Marker position={[userCoords.lat, userCoords.lng]}>
                  <Popup className="font-black">Vous êtes ici</Popup>
                </Marker>
              )}
              
              {displayRestaurants.map(pos => (
                <Marker key={pos.id} position={[pos.lat, pos.lng]}>
                  <Popup>
                    <div className="p-1">
                       <h4 className="font-black uppercase text-[#DA291C]">{pos.name}</h4>
                       <p className="text-xs font-bold text-gray-500 m-0">{pos.address}</p>
                       <button 
                         onClick={() => setSelectedPOS(pos)}
                         className="mt-2 w-full bg-gray-900 text-white py-1 px-2 rounded-lg text-[10px] font-black uppercase"
                       >
                         Choisir ce point
                       </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
           </MapContainer>
           {!userCoords && (
             <div className="absolute top-8 left-8 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-lg border border-yellow-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black uppercase text-gray-500">Géolocalisation inactive</span>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayRestaurants.map(r => {
            const isSelected = selectedPOS?.id === r.id;
            const hasCoords = r.lat !== undefined && r.lng !== undefined;
            const dist = (userCoords && hasCoords) ? Math.round(Math.sqrt(Math.pow(r.lat - userCoords.lat, 2) + Math.pow(r.lng - userCoords.lng, 2)) * 111) : null;

            return (
              <div key={r.id} className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all shadow-xl group ${isSelected ? 'border-[#DA291C] ring-4 ring-red-50' : 'border-white hover:border-[#FFC72C]'}`}>
                <div className="flex justify-between items-start mb-6">
                   <div className="bg-gray-100 p-4 rounded-2xl group-hover:bg-[#FFC72C] group-hover:text-[#DA291C] transition-colors">
                      <UtensilsCrossed className="w-6 h-6" />
                   </div>
                   <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest ${r.isOpen !== false ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'}`}>
                      {r.isOpen !== false ? 'Ouvert' : 'Temporairement Fermé'}
                   </span>
                </div>
                
                <h3 className="font-black text-2xl uppercase tracking-tighter text-gray-900 mb-2">{r.name}</h3>
                <p className="font-bold text-gray-500 mb-1 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#DA291C]" /> {r.address}</p>
                {dist !== null && <p className="text-xs font-black text-[#DA291C] uppercase tracking-widest mb-6">À {dist} km de votre position</p>}
                
                <div className="space-y-3 mt-6">
                   <button 
                     onClick={() => { setSelectedPOS(r); window.scrollTo(0,0); }}
                     className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg transition-all ${isSelected ? 'bg-gray-900 text-white' : 'bg-[#DA291C] text-white hover:bg-red-700'}`}
                   >
                     {isSelected ? 'Restaurant Sélectionné' : 'Commander ici'}
                   </button>
                   <a href={`tel:${r.phone?.replace(/\s/g, '') || COUNTRIES[country].phone}`} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-gray-100 text-gray-400 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                      <Phone className="w-4 h-4" /> Appeler le restaurant
                   </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- PRODUCT CARD ---
const ProductCard: React.FC<{ product: ProductInfo }> = ({ product }) => {
  const { setSelectedProduct, formatPriceC } = useCart();
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => setSelectedProduct(product)} 
      className={`bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:border-gray-200 hover:ring-4 hover:ring-gray-50 transition-all duration-300 flex flex-col group cursor-pointer h-full relative`}
    >
      {product.badge && <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-10 text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl uppercase tracking-wider shadow-lg transform -rotate-2 ${product.badge.includes('Deal') ? 'bg-[#FFC72C] text-[#DA291C]' : 'bg-[#DA291C]'}`}>{product.badge}</div>}
      <div className="w-full relative aspect-[4/3] sm:aspect-[5/4] bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden p-4 sm:p-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent opacity-80" />
        <img src={product.image} alt={product.name} className="w-full h-full object-contain filter drop-shadow-md sm:drop-shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3" loading="lazy" />
      </div>
      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between bg-white relative z-10 rounded-t-2xl sm:rounded-t-3xl -mt-4">
        <div>
          <h4 className="font-black text-lg sm:text-xl text-gray-900 leading-tight mb-1 sm:mb-2 uppercase tracking-tight group-hover:text-[#DA291C] transition-colors">{product.name}</h4>
          <p className="text-gray-500 font-medium text-[11px] sm:text-xs line-clamp-2 leading-relaxed mb-3 sm:mb-4">{product.description}</p>
        </div>
        <div className="flex justify-between items-end mt-auto pt-3 sm:pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            {product.oldPrice && <span className="text-[10px] sm:text-xs font-black text-gray-400 line-through mb-0.5">{formatPriceC(product.oldPrice)}</span>}
            <span className="font-black text-lg sm:text-[22px] tracking-tight text-[#DA291C]">{formatPriceC(product.price)}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }} className="bg-[#FFC72C] hover:bg-yellow-400 text-[#DA291C] w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(255,199,44,0.3)] sm:shadow-[0_4px_15px_rgba(255,199,44,0.4)] hover:scale-110 active:scale-95 border-b-[3px] sm:border-b-[4px] border-yellow-600 active:border-b-0 active:translate-y-[3px] sm:active:translate-y-[4px]">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- PRODUCT MODAL ---
const ProductDetailModal: React.FC<{ product: ProductInfo, onClose: () => void }> = ({ product, onClose }) => {
  const { addToCart, formatPriceC } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset'; }; }, []);

  const addons = [
    { id: '1', name: 'Extra Fromage', price: 1500 },
    { id: '2', name: 'Bacon', price: 2000 },
    { id: '3', name: 'Sauce Piquante', price: 500 }
  ];

  const handleAdd = () => {
    let finalInstructions = instructions;
    if (selectedAddons.length > 0) {
      const addonNames = selectedAddons.map(id => addons.find(a => a.id === id)?.name).join(', ');
      finalInstructions = `Suppléments: ${addonNames}. ${instructions}`;
    }
    
    const addonsTotal = selectedAddons.reduce((sum, id) => sum + (addons.find(a => a.id === id)?.price || 0), 0);
    const finalProduct = { ...product, price: product.price + addonsTotal };
    
    addToCart(finalProduct, quantity, finalInstructions);
    onClose();
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const currentAddonsTotal = selectedAddons.reduce((sum, id) => sum + (addons.find(a => a.id === id)?.price || 0), 0);
  const finalPrice = product.price + currentAddonsTotal;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center bg-black/70 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 backdrop-blur-md shadow-xl rounded-full flex items-center justify-center text-gray-900 border border-gray-200 hover:bg-gray-100"><X className="w-5 h-5 font-black stroke-[3]" /></button>
        <div className="w-full h-1/3 sm:h-[280px] relative shrink-0 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-8 overflow-hidden">
           <div className="absolute inset-0 bg-[#FFC72C] opacity-[0.03] pattern-diagonal-lines pattern-size-4"></div>
           <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }} src={product.image} alt={product.name} className="w-full h-full object-contain filter drop-shadow-2xl relative z-10" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white flex flex-col border-t border-gray-100">
          <h1 className="font-black text-3xl uppercase tracking-tight text-gray-900 leading-none mb-2">{product.name}</h1>
          <span className="font-black text-2xl text-[#DA291C] mb-4">{formatPriceC(product.price)}</span>
          <p className="font-bold text-gray-500 text-sm leading-relaxed mb-6">{product.description}</p>
          
          {/* Visual Addons */}
          <div className="mb-6">
             <h3 className="font-black text-gray-900 text-xs uppercase mb-3 flex items-center justify-between">Ajoutez des Extras <span className="bg-orange-100 text-[#DA291C] px-2 py-1 rounded text-[10px]">Populaire</span></h3>
             <div className="grid grid-cols-1 gap-2">
               {addons.map(addon => {
                 const isSelected = selectedAddons.includes(addon.id);
                 return (
                   <div 
                     key={addon.id} 
                     onClick={() => toggleAddon(addon.id)}
                     className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-[#DA291C] bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                   >
                      <div className="flex items-center gap-3">
                         <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[#DA291C] border-[#DA291C]' : 'border-gray-300'}`}>
                           {isSelected && <Star className="w-3 h-3 text-white fill-white" />}
                         </div>
                         <span className="font-bold text-sm text-gray-800">{addon.name}</span>
                      </div>
                      <span className="font-black text-[#DA291C] text-sm">+{formatPriceC(addon.price)}</span>
                   </div>
                 )
               })}
             </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-auto">
            <label className="font-black text-gray-900 text-xs uppercase mb-2 flex items-center justify-between">Instructions spéciales<span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">Optionnel</span></label>
            <textarea rows={2} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Ex: Sans oignons, sauce à part..." className="w-full bg-white border border-gray-300 p-3 text-sm font-bold outline-none focus:border-[#DA291C] rounded-xl mt-2 transition-colors" />
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] shrink-0 flex gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 bg-gray-50 border border-gray-200 rounded-[1.25rem] px-2 shrink-0 font-black">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-xl p-3 hover:text-[#DA291C] transition-colors"><Minus className="w-5 h-5 stroke-[3]"/></button>
            <span className="text-xl w-4 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="text-xl p-3 hover:text-[#DA291C] transition-colors"><Plus className="w-5 h-5 stroke-[3]"/></button>
          </div>
          <button onClick={handleAdd} className="flex-1 bg-[#DA291C] text-white px-4 sm:px-5 py-4 rounded-[1.25rem] font-black text-sm sm:text-lg flex justify-between items-center shadow-[0_10px_20px_rgba(218,41,28,0.3)] hover:scale-[1.02] active:scale-95 border-b-[5px] border-red-900 active:border-b-0 active:translate-y-[5px] uppercase tracking-wider sm:tracking-widest transition-all">
            <span>Ajouter</span><span className="bg-white/20 px-2 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm shadow-inner">{formatPriceC(finalPrice * quantity)}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- TRACKING PAGE REAL-TIME GPS COMPONENT ---
function MapAutoUpdater({ storePos, destPos, routeCoords = [] }: { storePos: [number, number], destPos: [number, number], routeCoords?: [number, number][] }) {
  const mapInstance = useMap();
  useEffect(() => {
    if (mapInstance && storePos && destPos) {
       // Timeout ensures map is fully rendered before calculating bounds
       setTimeout(() => {
         mapInstance.invalidateSize();
         if (routeCoords.length > 0) {
           mapInstance.fitBounds(routeCoords, { padding: [50, 50], maxZoom: 16 });
         } else if (storePos[0] !== destPos[0] || storePos[1] !== destPos[1]) {
           mapInstance.fitBounds([storePos, destPos], { padding: [50, 50], maxZoom: 16 });
         } else {
           mapInstance.setView(storePos, 15);
         }
       }, 500);
    }
  }, [storePos, destPos, routeCoords, mapInstance]);
  return null;
}

// --- TRACKING PAGE ---
function PageTracking() {
  const { activeOrder, formatPriceC, whatsappNumber, selectedPOS, globalConfig } = useCart();
  const navigate = useNavigate();
  const storePos: [number, number] = [selectedPOS?.lat || -18.910012, selectedPOS?.lng || 47.525581];
  const destPos: [number, number] = activeOrder?.orderMode === 'livraison' ? [-18.918000, 47.532000] : storePos;
  
  const [pos, setPos] = useState<[number, number]>(storePos);
  const [isLiveGPS, setIsLiveGPS] = useState(false);
  const [dynamicEta, setDynamicEta] = useState<number>(activeOrder?.etaMinutes || 0);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  // FETCH REAL ROUTE FROM OPENSTREETMAP (OSRM)
  useEffect(() => {
    if (!activeOrder || activeOrder.orderMode !== 'livraison') return;
    fetch(`https://router.project-osrm.org/route/v1/driving/${storePos[1]},${storePos[0]};${destPos[1]},${destPos[0]}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
           const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
           setRouteCoords(coords);
        }
      })
      .catch(err => console.error("OSRM fetch error", err));
  }, [activeOrder, storePos[0], storePos[1], destPos[0], destPos[1]]);

  // DYNAMIC ETA CALCULATION
  useEffect(() => {
     if (activeOrder?.orderMode === 'livraison') {
       const distMeters = L.latLng(pos).distanceTo(L.latLng(destPos));
       // Real-time Traffic simulation: 350 meters per minute + 2 mins parking
       const driveMinutes = Math.max(1, Math.ceil((distMeters / 350) + 2));
       
       let totalEta = driveMinutes;
       
       const statuses = globalConfig?.customStatuses || [
           { id: 'pending' }, { id: 'preparing' }, { id: 'ready' }, { id: 'delivering' }, { id: 'completed' }
       ];
       const currentIdx = statuses.findIndex((s:any) => s.id === activeOrder.status);
       
       // Add fixed times if early in the pipeline (rough generic estimate)
       if (currentIdx === 0) totalEta += 15;
       else if (currentIdx === 1) totalEta += 10;
       else if (currentIdx === 2) totalEta += 5;
       
       setDynamicEta(totalEta);
     } else {
       setDynamicEta(activeOrder?.etaMinutes || 0);
     }
  }, [pos, destPos, activeOrder, globalConfig]);

  // REAL-TIME GPS SIMULATOR ALONG ROADS
  useEffect(() => {
    if (!activeOrder || activeOrder.orderMode !== 'livraison') return;
    
    if (activeOrder?.driverLocation) {
      setPos([activeOrder.driverLocation.lat, activeOrder.driverLocation.lng]);
      return;
    }

    if (activeOrder.status !== 'delivering' && activeOrder.status !== 'completed') {
      setPos(storePos);
      setIsLiveGPS(false);
      return;
    }

    let isSubscribed = true;
    setIsLiveGPS(true); 
    let t = 0; // Progress from 0 to 1
    
    // Animate smoothly over 2 minutes (120 seconds = 120 updates at 1s each)
    const totalSteps = 120;
    const progressPerStep = 1 / totalSteps;

    const interval = setInterval(() => {
      t += progressPerStep;
      if (t > 1) t = 1;
      
      if (isSubscribed) {
        if (routeCoords.length > 0) {
           // Interpolate along actual roads
           const exactFloatIndex = t * (routeCoords.length - 1);
           const i = Math.floor(exactFloatIndex);
           const fraction = exactFloatIndex - i;
           if (i >= routeCoords.length - 1) {
              setPos(routeCoords[routeCoords.length - 1]);
           } else {
              const p1 = routeCoords[i];
              const p2 = routeCoords[i+1];
              setPos([
                  p1[0] + (p2[0] - p1[0]) * fraction,
                  p1[1] + (p2[1] - p1[1]) * fraction
              ]);
           }
        } else {
           // Fallback to strict linear if route failed to load
           const jitterLat = (Math.random() - 0.5) * 0.0002;
           const jitterLng = (Math.random() - 0.5) * 0.0002;
           const lat = storePos[0] + (destPos[0] - storePos[0]) * t + (t < 1 ? jitterLat : 0);
           const lng = storePos[1] + (destPos[1] - storePos[1]) * t + (t < 1 ? jitterLng : 0);
           setPos([lat, lng]);
        }
      }
      
      if (t >= 1) clearInterval(interval);
    }, 1000); 

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeOrder, routeCoords]); // Re-run if we get road coordinates

  const sendToWhatsApp = () => {
    if (!activeOrder) return;
    let message = `*🔴 INFOS SUR MA COMMANDE ${activeOrder.orderNumber || activeOrder.id}*\n\n`;
    message += `*Nom :* ${activeOrder.customerName}\n`;
    message += `\n*--- DÉTAIL DE LA COMMANDE ---*\n`;
    activeOrder.items.forEach((item: any) => {
      message += `🍔 ${item.quantity}x ${item.product.name} (${formatPriceC(item.product.price * item.quantity)})\n`;
      if (item.instructions) message += `   ↳ _Note: ${item.instructions}_\n`;
    });
    message += `\n*Total :* *${formatPriceC(activeOrder.total)}*\n\n`;
    message += `J'aimerais avoir une information à propos de l'avancement ! 👍`;
    
    const baseUrl = `https://wa.me/${whatsappNumber.replace(/\s+/g, '')}`;
    window.open(`${baseUrl}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!activeOrder) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
         <Navigation className="w-20 h-20 text-gray-200 mb-6" />
         <h2 className="font-black text-2xl text-gray-900 mb-2">Aucune commande en cours</h2>
         <p className="text-gray-500 font-bold mb-6">Vous n'avez aucune livraison active pour le moment.</p>
         <button onClick={() => navigate('/menu')} className="bg-[#DA291C] text-white px-8 py-3 rounded-xl font-black shadow-[0_4px_15px_rgba(218,41,28,0.4)] border-b-[3px] border-red-900 active:border-b-0 active:translate-y-[3px]">Voir le Menu</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 sm:pb-8">
      {/* Tracker Status Banner */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-20 relative">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <span className="bg-[#DA291C]/10 text-[#DA291C] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 inline-block">
                 {activeOrder.orderMode === 'livraison' ? 'Livraison en cours' : 'À récupérer'}
               </span>
               <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none mb-2">Commande {activeOrder.orderNumber || activeOrder.id}</h1>
               <p className="text-gray-500 font-bold flex items-center gap-2"><MapPin className="w-4 h-4" /> {activeOrder.address}</p>
            </div>
            
            <div className="flex gap-6 w-full md:w-auto bg-gray-50 p-4 rounded-xl border border-gray-100">
               <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Montant payé</span>
                  <span className="text-xl font-black text-gray-900">{formatPriceC(activeOrder.total)}</span>
               </div>
               <div className="border-l border-gray-200 pl-6">
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Heure estimée</span>
                  <span className="text-xl font-black text-[#25D366] flex items-center gap-1"><Timer className="w-5 h-5"/> {dynamicEta} min</span>
               </div>
            </div>
          </div>
          
          {/* Tracker Status Progress */}
          <div className="mt-8">
             {(() => {
                const statuses = globalConfig?.customStatuses || [
                  { id: 'pending', label: 'Nouvelle', customerLabel: 'Commande reçue, en attente...', color: 'bg-red-100 text-red-700', isTerminal: false },
                  { id: 'preparing', label: 'En cuisine', customerLabel: 'Vos plats sont en cours de préparation en cuisine ! 👨‍🍳', color: 'bg-orange-100 text-orange-700', isTerminal: false },
                  { id: 'ready', label: 'Prête', customerLabel: 'Commande prête !', color: 'bg-yellow-100 text-yellow-700', isTerminal: false },
                  { id: 'delivering', label: 'En livraison', customerLabel: 'Le livreur est en route vers chez vous ! 🛵', color: 'bg-blue-100 text-blue-700', isTerminal: false },
                  { id: 'completed', label: 'Terminée', customerLabel: 'Commande terminée !', color: 'bg-green-100 text-green-700', isTerminal: true },
                  { id: 'canceled', label: 'Annulée', customerLabel: 'Commande annulée.', color: 'bg-gray-100 text-gray-500', isTerminal: true, isCanceled: true }
                ];

                const currentIdx = statuses.findIndex((s:any) => s.id === activeOrder.status);
                const validStatuses = statuses.filter((s:any) => !s.isCanceled); // typically progress bar ignores canceled state
                const currentValidIdx = validStatuses.findIndex((s:any) => s.id === activeOrder.status);
                const progressPct = currentValidIdx >= 0 ? Math.max(10, ((currentValidIdx + 1) / validStatuses.length) * 100) : 0;
                
                const currentStatusObj = statuses.find((s:any) => s.id === activeOrder.status);

                return (
                  <>
                     <div className="flex justify-between mb-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase text-center gap-1">
                        {validStatuses.map((st:any, i:number) => (
                           <span key={st.id} className={currentValidIdx >= i ? "text-[#DA291C] flex-1 line-clamp-1" : "flex-1 line-clamp-1"}>{st.label}</span>
                        ))}
                     </div>
                     <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${currentStatusObj?.isCanceled ? 'bg-gray-400' : 'bg-gradient-to-r from-[#DA291C] to-[#FFC72C]'}`}
                          style={{ width: currentStatusObj?.isCanceled ? '100%' : `${progressPct}%` }} 
                        />
                     </div>
                     <div className="mt-4 text-center bg-gray-50 py-3 rounded-xl border border-gray-100">
                       <p className={`font-black text-sm uppercase tracking-wider ${currentStatusObj?.isCanceled ? 'text-gray-500' : 'text-[#DA291C]'}`}>
                         {currentStatusObj?.customerLabel || 'Statut inconnu'}
                       </p>
                     </div>
                  </>
                );
             })()}
          </div>
        </div>
      </div>
      
      {/* Content Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Order Details Receipt */}
        <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 z-10">
           <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 relative overflow-hidden">
             
             {/* Receipt Visual effect */}
             <div className="absolute top-0 left-0 w-full h-3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 blur-[1px]"></div>
             <div className="absolute -left-4 top-1/2 w-8 h-8 rounded-full bg-gray-50 border-r border-gray-100"></div>
             <div className="absolute -right-4 top-1/2 w-8 h-8 rounded-full bg-gray-50 border-l border-gray-100"></div>
             <div className="border-b-2 border-dashed border-gray-200 absolute top-1/2 left-4 right-4 z-0"></div>

             <div className="relative z-10 pb-6 mb-6">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-lg mb-4 flex justify-between items-center">
                  Mon Reçu 
                  <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-lg text-[10px]">Facture en ligne</span>
                </h3>
                <div className="space-y-4">
                  {activeOrder.items.map((item: any, idx: number) => (
                     <div key={idx} className="flex justify-between items-start text-sm">
                        <div className="max-w-[70%]">
                           <p className="font-black text-gray-800"><span className="text-[#DA291C] mr-1">{item.quantity}x</span> {item.product.name}</p>
                           {item.instructions && <p className="text-xs font-bold text-gray-400 mt-1 italic line-clamp-1">{item.instructions}</p>}
                        </div>
                        <p className="font-black text-gray-900 shrink-0">{formatPriceC(item.product.price * item.quantity)}</p>
                     </div>
                  ))}
                </div>
             </div>
             
             <div className="relative z-10 pt-4">
                <div className="flex justify-between items-center mb-1">
                   <p className="font-bold text-gray-500 uppercase text-xs tracking-wider">Sous-Total</p>
                   <p className="font-black text-gray-700">{formatPriceC(activeOrder.total)}</p>
                </div>
                <div className="flex justify-between items-center mb-4">
                   <p className="font-bold text-gray-500 uppercase text-xs tracking-wider">Livraison</p>
                   <p className="font-black text-gray-700">{activeOrder.orderMode === 'livraison' ? formatPriceC(globalConfig?.deliveryFee || 0) : formatPriceC(0)}</p>
                </div>
                
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                   <p className="font-black text-gray-400 uppercase tracking-widest text-sm">Total payé</p>
                   <p className="font-black text-3xl text-gray-900">{formatPriceC(activeOrder.total + (activeOrder.orderMode === 'livraison' ? (globalConfig?.deliveryFee || 0) : 0))}</p>
                </div>
             </div>
           </div>

           {/* Support Button */}
           <button onClick={sendToWhatsApp} className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 px-6 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all border-b-[4px] border-green-700 active:border-b-0 active:translate-y-[4px]">
             <MessageCircle className="w-6 h-6" /> Contacter le Support
           </button>
        </div>

        {/* Right Column: Map Content */}
        <div className="flex-1 flex flex-col min-h-[350px] sm:min-h-[400px]">
          {activeOrder.orderMode === 'livraison' ? (
            <div className="bg-white rounded-[2rem] p-2 border border-gray-200 shadow-xl overflow-hidden flex-1 relative min-h-[400px] sm:min-h-[500px]">
              <MapContainer center={storePos} zoom={14} style={{ height: '100%', width: '100%', borderRadius: '1.75rem' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker position={storePos} icon={storeIcon}><Popup>Restaurant La Gastronomie</Popup></Marker>
                <Marker position={destPos} icon={homeIcon}><Popup>Adresse de Livraison</Popup></Marker>
                <Polyline positions={routeCoords.length > 0 ? routeCoords : [storePos, destPos]} pathOptions={{ color: '#DA291C', weight: 4, dashArray: routeCoords.length > 0 ? undefined : '8, 8' }} />
                <Marker position={pos} icon={bikeIcon}><Popup>Votre livreur est en route !</Popup></Marker>
                <MapAutoUpdater storePos={storePos} destPos={destPos} routeCoords={routeCoords} />
              </MapContainer>
              
              {/* Overlay Driver Info */}
              <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-[1000] flex flex-col gap-3">
                 {isLiveGPS && (
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase text-green-600 bg-green-50 w-fit px-2 py-1 rounded-md tracking-widest border border-green-200">
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping inline-block"></span>
                     Signal GPS Connecté
                   </div>
                 )}
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-3xl shrink-0">👨‍🍳</div>
                     <div>
                       <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Votre Livreur</span>
                       <h3 className="font-black text-gray-900 text-lg leading-tight">Christian T.</h3>
                       <div className="flex items-center gap-1 text-[#FFC72C] mt-0.5"><Star className="w-3 h-3 fill-[#FFC72C]" /><Star className="w-3 h-3 fill-[#FFC72C]" /><Star className="w-3 h-3 fill-[#FFC72C]" /><Star className="w-3 h-3 fill-[#FFC72C]" /><Star className="w-3 h-3 fill-[#FFC72C]" /></div>
                     </div>
                   </div>
                   <button className="bg-[#DA291C] p-3 rounded-full text-white shadow-md active:scale-90 transition-transform">
                     <Phone className="w-5 h-5 fill-current" />
                   </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-gray-200 shadow-xl text-center flex flex-col items-center justify-center h-full">
              <ShoppingBag className="w-24 h-24 text-[#DA291C] mb-8" />
              <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">Préparation en cours</h2>
              <p className="text-gray-500 font-bold mb-8 max-w-lg text-lg">Veuillez vous présenter au comptoir du restaurant avec le numéro de commande de manière à récupérer votre commande chaude.</p>
              <div className="bg-gray-50 border border-gray-200 px-10 py-8 rounded-3xl">
                 <span className="text-sm font-black uppercase text-gray-400 block mb-2">Code de Retrait</span>
                 <span className="text-5xl font-black text-gray-900 tracking-widest">{activeOrder.orderNumber || activeOrder.id}</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function PageRecrutement() {
  const navigate = useNavigate();
  return (
    <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-inner border border-gray-100">🚀</div>
      <h1 className="font-black text-4xl text-gray-900 uppercase tracking-tight mb-4">Rejoignez l'Équipe</h1>
      <p className="text-gray-500 font-bold mb-8 max-w-lg">Nous préparons quelque chose de grand. Le portail de recrutement sera bientôt disponible en ligne pour trouver nos prochains talents G.</p>
      <button onClick={() => navigate('/')} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black hover:bg-gray-800 transition-colors">Retour à l'Accueil</button>
    </div>
  );
}
