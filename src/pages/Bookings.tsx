import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  MoreVertical,
  Download,
  XCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  CreditCard
} from 'lucide-react';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Booking } from '../types';
import { toast } from 'react-hot-toast';

import { downloadBookingsCSV } from '../utils/reportGenerator';

export const Bookings = () => {
  const { user, isAdmin } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    if (!user) return;

    let q = collection(db, 'bookings');
    
    // If not admin, only show own bookings
    if (!isAdmin) {
      q = query(q, where('travelerId', '==', user.id));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  const handleExport = () => {
    if (filteredBookings.length === 0) {
      toast.error('No bookings to export');
      return;
    }
    downloadBookingsCSV(filteredBookings);
    toast.success('Bookings exported successfully!');
  };

  // Auto-complete bookings that have passed their travel date
  useEffect(() => {
    if (bookings.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkAndComplete = async () => {
      for (const booking of bookings) {
        if (booking.status === 'Confirmed' && booking.travelDate) {
          const travelDate = new Date(booking.travelDate);
          if (travelDate < today) {
            try {
              await updateDoc(doc(db, 'bookings', booking.id), { status: 'Completed' });
            } catch (error) {
              console.error('Failed to auto-complete booking:', booking.id);
            }
          }
        }
      }
    };

    checkAndComplete();
  }, [bookings]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const booking = bookings.find(b => b.id === id);
      if (!booking) return;

      const updates: any = { status };

      if (status === 'Confirmed') {
        updates.confirmedAt = new Date().toISOString();
      }

      if (status === 'Cancelled' && booking.status === 'Confirmed' && booking.confirmedAt) {
        const confirmedDate = new Date(booking.confirmedAt);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - confirmedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 10 && booking.paymentStatus === 'Paid') {
          updates.paymentStatus = 'Refunded';
          toast.success('Booking cancelled and payment refunded (within 10 days)');
        } else {
          toast.success('Booking cancelled');
        }
      } else {
        toast.success(`Booking ${status}`);
      }

      await updateDoc(doc(db, 'bookings', id), updates);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await deleteDoc(doc(db, 'bookings', id));
      toast.success('Booking deleted');
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.bookingRef.toLowerCase().includes(search.toLowerCase()) || 
                         b.destinationName?.toLowerCase().includes(search.toLowerCase()) ||
                         b.destinationCountry?.toLowerCase().includes(search.toLowerCase()) ||
                         b.travelerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white dark:text-white light:text-slate-900">Bookings Management</h1>
          <p className="text-slate-400">Track and manage travel reservations</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="bg-white/5 hover:bg-white/10 text-white dark:text-white light:text-slate-900 px-4 py-2 rounded-xl border border-white/10 transition-colors flex items-center gap-2"
          >
            <Download size={18} /> Export
          </button>
        </div>
      </header>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by Ref, Destination, Country or Traveler..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-brand-accent dark:text-white light:text-slate-900"
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === status ? 'bg-brand-accent text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Booking Ref</th>
                <th className="px-6 py-4 font-bold">Destination</th>
                <th className="px-6 py-4 font-bold">Traveler</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Passengers</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-brand-accent mx-auto" size={32} />
                  </td>
                </tr>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-white dark:text-white light:text-slate-900">{booking.bookingRef}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white dark:text-white light:text-slate-900 font-medium">{booking.destinationName || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-300 dark:text-slate-300 light:text-slate-600">{booking.travelerName || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {booking.travelDate}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {booking.passengers}
                    </td>
                    <td className="px-6 py-4 font-bold text-white dark:text-white light:text-slate-900">
                      ₹{booking.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border w-fit ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        {booking.paymentStatus === 'Unpaid' && booking.status !== 'Cancelled' && (
                          <Link 
                            to={`/payments?bookingId=${booking.id}`}
                            className="text-[10px] text-brand-accent hover:underline flex items-center gap-1"
                          >
                            <CreditCard size={10} /> Pay Now
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAdmin && booking.status === 'Pending' && (
                          <button 
                            onClick={() => updateStatus(booking.id, 'Confirmed')}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Confirm"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        {(isAdmin || booking.status === 'Pending') && booking.status !== 'Cancelled' && (
                          <button 
                            onClick={() => updateStatus(booking.id, 'Cancelled')}
                            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={() => deleteBooking(booking.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-slate-500">
                    No bookings found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
