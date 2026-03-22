import React, { useEffect, useState } from 'react';
import { 
  IndianRupee, 
  Calendar, 
  Users, 
  MapPin, 
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Plus,
  BarChart3,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Booking, Destination, Traveler } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'react-hot-toast';
import { seedDestinations, seedBookings } from '../utils/seeder';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="glass p-6 rounded-2xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 bg-${color}-500 group-hover:scale-110 transition-transform duration-500`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
          <TrendingUp size={12} />
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

import { downloadBookingsCSV } from '../utils/reportGenerator';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    revenue: 0,
    bookings: 0,
    travelers: 0,
    destinations: 0
  });
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const destinationsSnap = await getDocs(collection(db, 'destinations'));
      const travelersSnap = await getDocs(collection(db, 'travelers'));

      const bookings = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setAllBookings(bookings);
      
      const totalRevenue = bookings.reduce((acc, b) => {
        if (b.paymentStatus === 'Refunded') return acc;
        if (b.status === 'Cancelled' && b.paymentStatus !== 'Paid') return acc;
        return acc + (b.totalAmount || 0);
      }, 0);

      const totalTravelers = bookings.reduce((acc, b) => {
        if (b.status === 'Cancelled') return acc;
        return acc + (b.passengers || 0);
      }, 0);

      setStats({
        revenue: totalRevenue,
        bookings: bookingsSnap.size,
        travelers: totalTravelers,
        destinations: destinationsSnap.size
      });

      // Calculate dynamic chart data for the last 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          name: months[d.getMonth()],
          month: d.getMonth(),
          year: d.getFullYear(),
          revenue: 0
        });
      }

      bookings.forEach(b => {
        if (b.paymentStatus === 'Refunded') return;
        if (b.status === 'Cancelled' && b.paymentStatus !== 'Paid') return;
        
        const date = new Date(b.createdAt);
        const monthIndex = last6Months.findIndex(m => m.month === date.getMonth() && m.year === date.getFullYear());
        if (monthIndex !== -1) {
          last6Months[monthIndex].revenue += b.totalAmount || 0;
        }
      });

      setChartData(last6Months);

      const recentQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(5));
      const recentSnap = await getDocs(recentQuery);
      setRecentBookings(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateReport = () => {
    if (allBookings.length === 0) {
      toast.error('No bookings found to generate report');
      return;
    }
    downloadBookingsCSV(allBookings);
    toast.success('Booking report generated successfully!');
  };

  const seedData = async () => {
    try {
      setLoading(true);
      const count = await seedDestinations();
      toast.success(`${count} sample destinations added!`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  const seedSampleBookings = async () => {
    try {
      setLoading(true);
      const count = await seedBookings();
      toast.success(`${count} sample bookings added!`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to seed bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && stats.bookings === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-brand-accent" size={40} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white dark:text-white light:text-slate-900">Welcome, {user?.name}!</h1>
            <p className="text-slate-400">Ready for your next adventure?</p>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/destinations" className="glass p-8 rounded-3xl group hover:scale-[1.02] transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <MapPin size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white dark:text-white light:text-slate-900">Explore Destinations</h3>
            <p className="text-slate-400 mb-6">Discover the world's most beautiful places curated just for you.</p>
            <div className="flex items-center gap-2 text-brand-accent font-bold">
              Browse Now <ArrowUpRight size={18} />
            </div>
          </Link>

          <Link to="/bookings" className="glass p-8 rounded-3xl group hover:scale-[1.02] transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Calendar size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white dark:text-white light:text-slate-900">My Bookings</h3>
            <p className="text-slate-400 mb-6">Manage your upcoming trips and view your travel history.</p>
            <div className="flex items-center gap-2 text-brand-accent font-bold">
              View Trips <ArrowUpRight size={18} />
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white dark:text-white light:text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-400">Overview of Sanyog Yatra performance</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button 
                onClick={seedData}
                className="bg-white/5 hover:bg-white/10 text-white dark:text-white light:text-slate-900 px-4 py-2 rounded-xl border border-white/10 transition-colors flex items-center gap-2"
              >
                <Plus size={18} /> Seed Destinations
              </button>
              <button 
                onClick={seedSampleBookings}
                className="bg-white/5 hover:bg-white/10 text-white dark:text-white light:text-slate-900 px-4 py-2 rounded-xl border border-white/10 transition-colors flex items-center gap-2"
              >
                <Plus size={18} /> Seed Bookings
              </button>
            </>
          )}
          <button 
            onClick={handleGenerateReport}
            className="bg-gradient text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-opacity"
          >
            Generate Report
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} icon={IndianRupee} trend="+12.5%" color="indigo" />
        <StatCard title="Active Bookings" value={stats.bookings} icon={Calendar} trend="+5.2%" color="purple" />
        <StatCard title="Total Travelers" value={stats.travelers} icon={Users} color="emerald" />
        <StatCard title="Destinations" value={stats.destinations} icon={MapPin} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900">Revenue Overview</h3>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none dark:text-white light:text-slate-900">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#6366f1' : '#312e81'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl">
          <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900 mb-6">Recent Bookings</h3>
          <div className="space-y-4">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white dark:text-white light:text-slate-900">REF: {booking.bookingRef}</p>
                      <p className="text-xs text-slate-400">{booking.travelDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white dark:text-white light:text-slate-900">₹{booking.totalAmount.toLocaleString('en-IN')}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      booking.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                      booking.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-10">No recent bookings</p>
            )}
          </div>
          <Link to="/bookings" className="block text-center text-brand-accent text-sm font-bold mt-6 hover:underline">
            View All Bookings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 rounded-3xl">
          <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900 mb-6">Top Destinations</h3>
          <div className="space-y-4">
            {[
              { name: 'Santorini', country: 'Greece', bookings: 42, growth: '+12%', image: 'https://picsum.photos/seed/santorini/100/100' },
              { name: 'Kyoto', country: 'Japan', bookings: 38, growth: '+8%', image: 'https://picsum.photos/seed/kyoto/100/100' },
              { name: 'Swiss Alps', country: 'Switzerland', bookings: 31, growth: '+15%', image: 'https://picsum.photos/seed/alps/100/100' },
              { name: 'Paris', country: 'France', bookings: 28, growth: '+5%', image: 'https://picsum.photos/seed/paris/100/100' },
            ].map((dest, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <img src={dest.image} alt={dest.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-sm font-bold text-white dark:text-white light:text-slate-900">{dest.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{dest.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white dark:text-white light:text-slate-900">{dest.bookings} Bookings</p>
                  <p className="text-[10px] text-emerald-400 font-bold">{dest.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-3xl">
          <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Add Destination', icon: Plus, to: '/destinations', color: 'indigo' },
              { label: 'View Reports', icon: BarChart3, to: '/reports', color: 'purple' },
              { label: 'Manage Users', icon: Users, to: '/travelers', color: 'emerald' },
              { label: 'Settings', icon: Settings, to: '/settings', color: 'slate' },
            ].map((action, i) => (
              <Link 
                key={i} 
                to={action.to}
                className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className={`p-3 rounded-xl bg-${action.color}-500/10 text-${action.color}-500 mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon size={24} />
                </div>
                <span className="text-sm font-bold text-slate-300 dark:text-slate-300 light:text-slate-600">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
