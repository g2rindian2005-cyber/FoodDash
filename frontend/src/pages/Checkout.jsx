import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import Page from '../components/Page';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { items, totals } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    navigate('/restaurants', { replace: true });
    return null;
  }

  return (
    <Page className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-extrabold">Checkout</h1>

      <div className="card p-6">
        <h2 className="mb-4 font-bold">Order summary</h2>
        <ul className="divide-y">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-3">
              <span className="text-gray-700">
                {i.name} <span className="text-gray-400">× {i.quantity}</span>
              </span>
              <span className="font-medium">₹{i.price * i.quantity}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t pt-4 text-sm text-gray-600">
          <div className="flex justify-between"><span>Item total</span><span>₹{totals.subtotal}</span></div>
          <div className="flex justify-between"><span>Delivery fee</span><span>₹{totals.deliveryFee}</span></div>
          <div className="flex justify-between"><span>Taxes</span><span>₹{totals.taxes}</span></div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-green-600"><span>Coupon discount</span><span>-₹{totals.discount}</span></div>
          )}
          <div className="flex justify-between pt-2 text-base font-bold text-gray-900">
            <span>To pay</span><span>₹{totals.total}</span>
          </div>
        </div>
      </div>

      <button onClick={() => navigate('/address')} className="btn-primary mt-6 w-full py-3">
        <MapPin className="h-5 w-5" /> Add delivery address <ArrowRight className="h-5 w-5" />
      </button>
    </Page>
  );
}
