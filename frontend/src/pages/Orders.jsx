import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch, ChevronRight } from 'lucide-react';
import Page from '../components/Page';
import api from '../api/axios';

const STATUS_STYLE = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders')
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page className="max-w-3xl">
      <h1 className="mb-6 text-3xl font-extrabold">My Orders</h1>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <PackageSearch className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-bold">No orders yet</h2>
          <p className="mt-1 text-gray-500">Once you place an order, it'll show up here.</p>
          <Link to="/restaurants" className="btn-primary mt-6 inline-flex px-6 py-3">Browse restaurants</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const trackable = o.status !== 'delivered' && o.status !== 'cancelled';
            const to = trackable ? `/order-tracking/${o.id}` : `/delivered/${o.id}`;
            return (
              <Link key={o.id} to={to} className="card flex items-center gap-4 p-4 hover:border-brand">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Order #{o.id}</h3>
                    <span className={`badge ${STATUS_STYLE[o.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {o.restaurant_name || 'Restaurant'} · {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{o.total}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </Link>
            );
          })}
        </div>
      )}
    </Page>
  );
}
