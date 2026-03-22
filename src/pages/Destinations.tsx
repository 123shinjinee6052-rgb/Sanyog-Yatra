import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  ChevronRight,
  Loader2,
  X,
  Calendar,
  MapPin
} from 'lucide-react';
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Destination, DestinationCategory } from '../types';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

import { getRealTimePrice } from '../services/pricingService';
import { RefreshCw } from 'lucide-react';

const categories: DestinationCategory[] = ['Heritage', 'Nature', 'Adventure', 'Beach', 'Spiritual'];

export const Destinations = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DestinationCategory | 'All'>('All');
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [refreshingPrice, setRefreshingPrice] = useState<string | null>(null);
  const [refreshAllLoading, setRefreshAllLoading] = useState(false);

  const handleRefreshAllPrices = async () => {
    if (!isAdmin) return;
    setRefreshAllLoading(true);
    try {
      // We'll process in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < destinations.length; i += batchSize) {
        const batch = destinations.slice(i, i + batchSize);
        await Promise.all(batch.map(async (dest) => {
          const realPrice = await getRealTimePrice(dest.name, dest.country);
          await updateDoc(doc(db, 'destinations', dest.id), {
            price: realPrice,
            lastPriceUpdate: new Date().toISOString()
          });
        }));
        // Small delay between batches
        if (i + batchSize < destinations.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      toast.success('All prices updated!');
    } catch (error) {
      toast.error('Failed to refresh prices');
    } finally {
      setRefreshAllLoading(false);
    }
  };

  const handleRefreshPrice = async (dest: Destination) => {
    setRefreshingPrice(dest.id);
    try {
      const realPrice = await getRealTimePrice(dest.name, dest.country);
      await updateDoc(doc(db, 'destinations', dest.id), {
        price: realPrice,
        lastPriceUpdate: new Date().toISOString()
      });
      toast.success(`Price updated for ${dest.name} to ₹${realPrice.toLocaleString('en-IN')}`);
    } catch (error) {
      toast.error('Failed to fetch price');
    } finally {
      setRefreshingPrice(null);
    }
  };

  useEffect(() => {
    const q = selectedCategory === 'All' 
      ? collection(db, 'destinations')
      : query(collection(db, 'destinations'), where('category', '==', selectedCategory));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Destination));
      const filtered = data.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase()) || 
        d.country.toLowerCase().includes(search.toLowerCase())
      );
      setDestinations(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory, search]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDest || !user) return;

    setBookingLoading(true);
    try {
      const bookingRef = `SY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const totalAmount = selectedDest.price * passengers;

      const bookingData = {
        bookingRef,
        destinationId: selectedDest.id,
        destinationName: selectedDest.name,
        destinationCountry: selectedDest.country,
        travelerId: user.id,
        travelerName: user.name,
        travelerEmail: user.email,
        travelDate: bookingDate,
        passengers,
        totalAmount,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Update available slots
      await updateDoc(doc(db, 'destinations', selectedDest.id), {
        availableSlots: increment(-passengers)
      });

      toast.success(`Booking Created! Redirecting to payment...`);
      setSelectedDest(null);
      setBookingDate('');
      setPassengers(1);
      
      // Navigate to payment page
      navigate(`/payments?bookingId=${docRef.id}`);
    } catch (error) {
      toast.error('Failed to book destination');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white dark:text-white light:text-slate-900">Explore Destinations</h1>
          <p className="text-slate-400">Find your perfect getaway</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={handleRefreshAllPrices}
            disabled={refreshAllLoading}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-colors flex items-center gap-2"
          >
            {refreshAllLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Refresh Prices
          </button>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-brand-accent dark:text-white light:text-slate-900"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === 'All' ? 'bg-brand-accent text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-brand-accent text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-brand-accent" size={40} />
        </div>
      ) : destinations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest) => (
            <div 
              key={dest.id} 
              className="glass rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={dest.imageUrl} 
                  alt={dest.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold text-amber-400">
                  <Star size={14} fill="currentColor" /> {dest.rating}
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-brand-accent text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-lg">
                    {dest.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900">{dest.name}</h3>
                    <p className="text-slate-400 text-sm flex items-center gap-1">
                      <MapPin size={14} /> {dest.country}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {refreshingPrice === dest.id ? (
                        <Loader2 className="animate-spin text-brand-accent" size={16} />
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefreshPrice(dest);
                          }}
                          className="p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-brand-accent transition-colors"
                          title="Update Price"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <p className="text-xl font-bold text-brand-accent">₹{dest.price.toLocaleString('en-IN')}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">per person</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 my-4 py-4 border-y border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Clock size={14} /> {dest.duration}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Users size={14} /> {dest.availableSlots} slots left
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedDest(dest)}
                  className="w-full bg-white/5 hover:bg-brand-accent hover:text-white text-slate-300 dark:text-slate-300 light:text-slate-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  View Details <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-3xl">
          <MapPin size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900 mb-2">No Destinations Found</h3>
          <p className="text-slate-400">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Booking Modal */}
      {selectedDest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="relative h-48">
              <img 
                src={selectedDest.imageUrl} 
                alt={selectedDest.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setSelectedDest(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white dark:text-white light:text-slate-900 mb-1">Book Trip to {selectedDest.name}</h2>
                <p className="text-slate-400 text-sm">{selectedDest.description}</p>
              </div>

              <form onSubmit={handleBooking} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Travel Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="date"
                        required
                        min={format(new Date(), 'yyyy-MM-dd')}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-accent text-sm dark:text-white light:text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Passengers</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-accent text-sm appearance-none dark:text-white light:text-slate-900"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                          <option key={n} value={n} className="bg-slate-800">{n} {n === 1 ? 'Person' : 'People'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Total Price</p>
                    <p className="text-2xl font-bold text-brand-accent">₹{(selectedDest.price * passengers).toLocaleString('en-IN')}</p>
                  </div>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="bg-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    {bookingLoading ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
