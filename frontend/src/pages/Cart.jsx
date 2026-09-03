import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingBag, Tag, Loader2, X } from 'lucide-react';
import Page from '../components/Page';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export default function Cart() {
  const { items, addItem, decrement, removeItem, totals, restaurantId, coupon, applyCoupon, removeCoupon } = useCart();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      const res = await api.post('/coupons/validate', { code: code.trim(), subtotal: totals.subtotal });
      applyCoupon(res.data.code, res.data.discount, res.data.description);
      notify(`${res.data.code} applied — you saved ₹${res.data.discount}!`, 'success');
      setCode('');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <Page className="max-w-2xl text-center">
        <div className="card p-12">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
          <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-1 text-gray-500">Add some delicious food to get started.</p>
          <Link to="/restaurants" className="btn-primary mt-6 px-6 py-3">Browse restaurants</Link>
        </div>
      </Page>
    );
  }

  return (
    <Page className="max-w-3xl">
      <h1 className="mb-6 text-3xl font-extrabold">Your Cart</h1>

      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="card flex items-center gap-4 p-4"
            >
              <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">₹{item.price} each</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-1.5">
                <button onClick={() => decrement(item.id)} className="text-brand"><Minus className="h-4 w-4" /></button>
                <span className="w-5 text-center font-bold">{item.quantity}</span>
                <button onClick={() => addItem(item, restaurantId)} className="text-brand"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="w-20 text-right font-bold">₹{item.price * item.quantity}</div>
              <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600">
                <Trash2 className="h-5 w-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Coupon */}
      <div className="card mt-6 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold"><Tag className="h-4 w-4 text-brand" /> Have a coupon?</h2>
        {coupon ? (
          <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 text-sm">
            <span className="font-medium text-green-700">
              {coupon.code} applied {coupon.description ? `· ${coupon.description}` : ''} — you saved ₹{coupon.discount}
            </span>
            <button onClick={removeCoupon} className="text-green-700 hover:text-red-600"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Enter coupon code (try WELCOME50)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
            />
            <button onClick={handleApplyCoupon} disabled={applying} className="btn-outline px-5">
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
        )}
      </div>

      {/* Bill */}
      <div className="card mt-6 p-6">
        <h2 className="mb-4 font-bold">Bill details</h2>
        <Row label="Item total" value={totals.subtotal} />
        <Row label="Delivery fee" value={totals.deliveryFee} />
        <Row label="Taxes (5%)" value={totals.taxes} />
        {totals.discount > 0 && <Row label="Coupon discount" value={-totals.discount} highlight />}
        <div className="my-3 border-t border-dashed" />
        <Row label="To pay" value={totals.total} bold />
        <button onClick={() => navigate('/checkout')} className="btn-primary mt-6 w-full py-3">
          Proceed to Checkout
        </button>
      </div>
    </Page>
  );
}

function Row({ label, value, bold, highlight }) {
  return (
    <div
      className={`flex items-center justify-between py-1 ${
        bold ? 'text-lg font-bold' : highlight ? 'font-medium text-green-600' : 'text-gray-600'
      }`}
    >
      <span>{label}</span>
      <span>₹{value}</span>
    </div>
  );
}
