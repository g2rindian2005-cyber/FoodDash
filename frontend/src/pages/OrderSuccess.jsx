import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin } from 'lucide-react';
import Page from '../components/Page';

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Page className="max-w-lg text-center">
      <div className="card p-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
        >
          <CheckCircle2 className="h-14 w-14 text-green-600" />
        </motion.div>

        <h1 className="mt-6 text-3xl font-extrabold">Order placed!</h1>
        <p className="mt-2 text-gray-500">
          Your order <span className="font-semibold text-gray-800">#{id}</span> has been confirmed
          and the restaurant is getting it ready.
        </p>

        <button onClick={() => navigate(`/order-tracking/${id}`)} className="btn-primary mt-8 w-full py-3">
          <MapPin className="h-5 w-5" /> Track your order
        </button>
      </div>
    </Page>
  );
}
