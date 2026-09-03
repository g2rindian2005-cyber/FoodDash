import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PartyPopper, Home, Utensils } from 'lucide-react';
import Page from '../components/Page';
import api from '../api/axios';

export default function Delivered() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((res) => setOrder(res.data)).catch(() => {});
  }, [id]);

  return (
    <Page className="max-w-lg text-center">
      <div className="card p-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand/10"
        >
          <PartyPopper className="h-14 w-14 text-brand" />
        </motion.div>

        <h1 className="mt-6 text-3xl font-extrabold">Delivered!</h1>
        <p className="mt-2 text-gray-500">
          Order <span className="font-semibold text-gray-800">#{id}</span> has been delivered.
          We hope you enjoy your meal. 🍽️
        </p>

        {order && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left text-sm">
            <div className="flex justify-between py-1"><span className="text-gray-500">Restaurant</span><span className="font-medium">{order.restaurant_name || '—'}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Items</span><span className="font-medium">{order.items?.length ?? '—'}</span></div>
            <div className="flex justify-between py-1"><span className="text-gray-500">Total paid</span><span className="font-bold">₹{order.total}</span></div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="btn-outline flex-1 py-3"><Home className="h-5 w-5" /> Home</Link>
          <Link to="/restaurants" className="btn-primary flex-1 py-3"><Utensils className="h-5 w-5" /> Order again</Link>
        </div>
      </div>
    </Page>
  );
}
