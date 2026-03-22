import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  QrCode, 
  Building2, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';

export const Payments = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'bank'>('qr');
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        navigate('/bookings');
        return;
      }
      try {
        const docRef = doc(db, 'bookings', bookingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error('Booking not found');
          navigate('/bookings');
        }
      } catch (error) {
        toast.error('Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, navigate]);

  const handlePayment = async () => {
    setPaying(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await updateDoc(doc(db, 'bookings', bookingId!), {
        status: 'Confirmed',
        paymentStatus: 'Paid',
        paidAt: new Date().toISOString()
      });

      toast.success('Payment Successful! Confirmation email sent.');
      // In a real app, a cloud function would trigger the email here.
      console.log(`Email notification sent to ${booking.travelerEmail || 'user'} for booking ${booking.bookingRef}`);
      
      navigate('/bookings');
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-brand-accent" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} /> Back to Bookings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-6">Select Payment Method</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${
                  paymentMethod === 'qr' 
                    ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <QrCode size={32} />
                <span className="font-bold">QR Code</span>
              </button>
              <button
                onClick={() => setPaymentMethod('bank')}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${
                  paymentMethod === 'bank' 
                    ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Building2 size={32} />
                <span className="font-bold">Bank Transfer</span>
              </button>
            </div>

            {paymentMethod === 'qr' ? (
              <div className="flex flex-col items-center space-y-6 py-4">
                <div className="p-4 bg-white rounded-2xl shadow-2xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=sanyogyatra@bank&pn=Sanyog%20Yatra&am=${booking.totalAmount}&cu=INR`} 
                    alt="Payment QR" 
                    className="w-48 h-48"
                  />
                </div>
                <div className="text-center">
                  <p className="text-slate-300 mb-2">Scan this QR code with any UPI app</p>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Sanyog Yatra Official Payment</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Bank Name</p>
                    <p className="text-white font-bold">Global Travel Bank</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Account Holder</p>
                    <p className="text-white font-bold">Sanyog Yatra Pvt Ltd</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Account Number</p>
                      <p className="text-white font-mono text-lg">9876 5432 1098 7654</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard('9876543210987654')}
                      className="p-2 text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">IFSC / SWIFT Code</p>
                    <p className="text-white font-mono">GTB0001234</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic">
                  * Please mention your Booking Ref: <span className="text-white font-bold">{booking.bookingRef}</span> in the transaction notes.
                </p>
              </div>
            )}
          </div>

          <div className="glass p-6 rounded-3xl flex items-center gap-4 border-emerald-500/20">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white">Secure Payment</h4>
              <p className="text-sm text-slate-400">Your transaction is protected with 256-bit SSL encryption.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Destination</span>
                <span className="text-white font-medium">{booking.destinationName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Booking Ref</span>
                <span className="text-white font-mono">{booking.bookingRef}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Travel Date</span>
                <span className="text-white font-medium">{booking.travelDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Passengers</span>
                <span className="text-white font-medium">{booking.passengers}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <span className="text-slate-400 font-bold uppercase text-xs">Total Amount</span>
                <span className="text-3xl font-bold text-brand-accent">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full bg-gradient text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand-accent/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Confirm Payment
                </>
              )}
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-brand-accent/5 border border-brand-accent/10">
            <p className="text-xs text-slate-400 leading-relaxed">
              By clicking "Confirm Payment", you agree to Sanyog Yatra's <span className="text-brand-accent cursor-pointer hover:underline">Terms of Service</span> and <span className="text-brand-accent cursor-pointer hover:underline">Cancellation Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
