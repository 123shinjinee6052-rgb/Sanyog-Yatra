import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Award, 
  Calendar, 
  Loader2,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Traveler, MembershipTier } from '../types';
import { toast } from 'react-hot-toast';
import { seedTravelers, removeSampleTravelers } from '../utils/seeder';

export const Travelers = () => {
  const { isAdmin } = useAuth();
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<Traveler | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    membershipTier: 'Bronze' as MembershipTier
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'travelers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Traveler));
      setTravelers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTraveler) {
        await updateDoc(doc(db, 'travelers', editingTraveler.id), formData);
        toast.success('Traveler updated');
      } else {
        await addDoc(collection(db, 'travelers'), {
          ...formData,
          totalTrips: 0,
          totalSpent: 0,
          joinedAt: new Date().toISOString()
        });
        toast.success('Traveler added');
      }
      setShowModal(false);
      setEditingTraveler(null);
      setFormData({ name: '', email: '', phone: '', membershipTier: 'Bronze' });
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'travelers', id));
      toast.success('Traveler removed');
    } catch (error) {
      toast.error('Failed to remove traveler');
    }
  };

  const handleSeedTravelers = async () => {
    try {
      setSeeding(true);
      const count = await seedTravelers();
      toast.success(`${count} sample travelers added!`);
    } catch (error) {
      toast.error('Failed to seed travelers');
    } finally {
      setSeeding(false);
    }
  };

  const handleRemoveSampleTravelers = async () => {
    try {
      setSeeding(true);
      const count = await removeSampleTravelers();
      toast.success(`${count} sample travelers removed!`);
    } catch (error) {
      toast.error('Failed to remove sample travelers');
    } finally {
      setSeeding(false);
    }
  };

  const filteredTravelers = travelers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'Gold': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Silver': return 'text-slate-300 bg-slate-300/10 border-slate-300/20';
      default: return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    }
  };

  if (!isAdmin) return <div className="p-8 text-center text-slate-400">Access Denied</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Travelers Directory</h1>
          <p className="text-slate-400">Manage your customer base and loyalty tiers</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleRemoveSampleTravelers}
            disabled={seeding}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl border border-red-500/20 transition-colors flex items-center gap-2"
          >
            {seeding ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
            Remove Samples
          </button>
          <button 
            onClick={handleSeedTravelers}
            disabled={seeding}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-colors flex items-center gap-2"
          >
            {seeding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            Seed 30 Travelers
          </button>
          <button 
            onClick={() => {
              setEditingTraveler(null);
              setFormData({ name: '', email: '', phone: '', membershipTier: 'Bronze' });
              setShowModal(true);
            }}
            className="bg-gradient text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={20} /> Add Traveler
          </button>
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search travelers by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-brand-accent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-brand-accent" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTravelers.map((traveler) => (
            <div key={traveler.id} className="glass p-6 rounded-3xl group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${getTierColor(traveler.membershipTier).split(' ')[1]}`} />
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-accent">
                  <Award size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingTraveler(traveler);
                      setFormData({
                        name: traveler.name,
                        email: traveler.email,
                        phone: traveler.phone,
                        membershipTier: traveler.membershipTier
                      });
                      setShowModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(traveler.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{traveler.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getTierColor(traveler.membershipTier)}`}>
                  {traveler.membershipTier} Member
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Mail size={16} /> {traveler.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Phone size={16} /> {traveler.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Calendar size={16} /> Joined {new Date(traveler.joinedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Trips</p>
                  <p className="text-lg font-bold text-white dark:text-white light:text-slate-900">{traveler.totalTrips}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Spent</p>
                  <p className="text-lg font-bold text-brand-accent">₹{traveler.totalSpent.toLocaleString('en-IN')}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Recent Activity</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-xs text-slate-400">Active traveler with high engagement</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-3xl p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{editingTraveler ? 'Edit Traveler' : 'Add New Traveler'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-accent"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-accent"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-accent"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Membership Tier</label>
                <select
                  value={formData.membershipTier}
                  onChange={(e) => setFormData({ ...formData, membershipTier: e.target.value as MembershipTier })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-accent appearance-none"
                >
                  <option value="Bronze" className="bg-slate-800">Bronze</option>
                  <option value="Silver" className="bg-slate-800">Silver</option>
                  <option value="Gold" className="bg-slate-800">Gold</option>
                  <option value="Platinum" className="bg-slate-800">Platinum</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-opacity mt-4"
              >
                {editingTraveler ? 'Update Traveler' : 'Add Traveler'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
