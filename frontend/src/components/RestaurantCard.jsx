import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Tag } from 'lucide-react';

export default function RestaurantCard({ restaurant }) {
  const r = restaurant;
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link to={`/restaurants/${r.id}`} className="card block overflow-hidden">
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={r.image_url}
            alt={r.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
          {!r.is_open && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white">
              Currently Closed
            </div>
          )}
          {r.offer_text && r.is_open && (
            <span className="absolute bottom-2 left-2 badge bg-brand text-white">
              <Tag className="h-3 w-3" /> {r.offer_text}
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900">{r.name}</h3>
            <span className="badge bg-green-600 text-white">
              <Star className="h-3 w-3 fill-white" /> {r.rating}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-gray-500">{r.cuisine}</p>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {r.delivery_time}
            </span>
            <span>₹{r.price_for_two} for two</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
