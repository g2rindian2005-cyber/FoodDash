import { motion } from 'framer-motion';
import { Plus, Minus, Leaf, Drumstick } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function FoodCard({ item, restaurantId, disabled }) {
  const { items, addItem, decrement } = useCart();
  const inCart = items.find((i) => i.id === item.id);

  return (
    <motion.div
      layout
      className="card flex items-center justify-between gap-4 p-4"
    >
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          {item.is_veg ? (
            <span className="flex h-4 w-4 items-center justify-center rounded border border-green-600">
              <Leaf className="h-3 w-3 text-green-600" />
            </span>
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded border border-red-600">
              <Drumstick className="h-3 w-3 text-red-600" />
            </span>
          )}
          <h4 className="font-semibold text-gray-900">{item.name}</h4>
        </div>
        <p className="font-medium text-gray-800">₹{item.price}</p>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p>
        )}
      </div>

      <div className="relative w-28 shrink-0">
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          className="h-24 w-28 rounded-xl object-cover"
        />
        {inCart ? (
          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white px-2 py-1 shadow">
            <button onClick={() => decrement(item.id)} className="text-brand">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-4 text-center text-sm font-bold">{inCart.quantity}</span>
            <button onClick={() => addItem(item, restaurantId)} className="text-brand">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            disabled={disabled}
            onClick={() => addItem(item, restaurantId)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-4 py-1 text-sm font-bold text-brand shadow disabled:opacity-50"
          >
            ADD
          </button>
        )}
      </div>
    </motion.div>
  );
}
