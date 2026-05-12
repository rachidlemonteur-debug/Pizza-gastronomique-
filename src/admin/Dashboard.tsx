import React from 'react';
import { useAdmin } from './AdminContext';
import { useFirestore } from '../hooks/useFirestore';
import { Clock, TrendingUp, ShoppingBag, Bike, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { selectedPosId, activePOS } = useAdmin();
  const { data: orders, loading } = useFirestore('orders', 'timestamp');
  const { data: drivers } = useFirestore('drivers');
  
  if (loading) {
    return <div className="text-gray-500 font-bold">Chargement du dashboard...</div>;
  }

  // Filter based on POS
  const filteredOrders = selectedPosId === 'ALL' ? orders : orders.filter((o: any) => o.posId === selectedPosId);
  const filteredDrivers = selectedPosId === 'ALL' ? drivers : drivers.filter((d: any) => d.posId === selectedPosId);

  // Stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = filteredOrders.filter((o: any) => new Date(o.createdAt || o.timestamp).getTime() > todayStart.getTime());
  
  const activeOrders = filteredOrders.filter((o: any) => !['completed', 'cancelled'].includes(o.status));
  const revenueToday = todayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const activeDrivers = filteredDrivers.filter((d: any) => d.status === 'available' || d.status === 'delivering');

  const StatCard = ({ title, value, icon, bg, text, link }: any) => (
    <Link to={link || '#'} className={`p-6 rounded-2xl ${bg} ${text} transition-transform hover:-translate-y-1 block`}>
      <div className="flex justify-between items-start mb-4">
         <h3 className="font-bold opacity-90">{title}</h3>
         {icon}
      </div>
      <p className="text-4xl font-black">{value}</p>
    </Link>
  );

  return (
    <div className="space-y-6">
       <div>
         <h1 className="text-2xl font-black text-gray-900 mb-1">
           {activePOS ? `Dashboard : ${activePOS.name}` : 'Dashboard Global'}
         </h1>
         <p className="text-gray-500 font-medium">Récapitulatif de l'activité du jour.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="En cours" 
            value={activeOrders.length} 
            icon={<Clock className="w-6 h-6" />}
            bg="bg-red-50" text="text-red-700"
            link="/admin/orders"
          />
          <StatCard 
            title="Commandes du jour" 
            value={todayOrders.length} 
            icon={<ShoppingBag className="w-6 h-6" />}
            bg="bg-blue-50" text="text-blue-700"
            link="/admin/orders"
          />
          <StatCard 
            title="Recettes estimées" 
            value={`${revenueToday.toLocaleString()} Ar`} 
            icon={<TrendingUp className="w-6 h-6" />}
            bg="bg-green-50" text="text-green-700"
          />
          <StatCard 
            title="Livreurs actifs" 
            value={activeDrivers.length} 
            icon={<Bike className="w-6 h-6" />}
            bg="bg-purple-50" text="text-purple-700"
            link="/admin/drivers"
          />
       </div>

       {/* Latest Orders Preview */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <div className="flex items-center justify-between mb-6">
           <h2 className="font-bold text-lg text-gray-900">Commandes Récents</h2>
           <Link to="/admin/orders" className="text-sm font-bold text-[#DA291C] hover:underline">Voir tout</Link>
         </div>
         {activeOrders.length === 0 ? (
           <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 font-medium flex flex-col items-center">
             <AlertCircle className="w-8 h-8 mb-2 text-gray-400" />
             Aucune commande en cours pour le moment.
           </div>
         ) : (
           <div className="space-y-3">
              {activeOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">#{order.orderNumber} - {order.customerName || 'Client'}</p>
                    <p className="text-sm text-gray-500 font-medium">{new Date(order.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#DA291C]">{order.total?.toLocaleString()} Ar</p>
                    <span className="text-xs font-bold uppercase px-2 py-1 bg-yellow-100 text-yellow-800 rounded mt-1 inline-block">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
           </div>
         )}
       </div>
    </div>
  );
}
