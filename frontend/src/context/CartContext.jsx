import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const DELIVERY_FEE = 40;
const TAX_RATE = 0.05; // 5%

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });
  // Track which restaurant the cart belongs to (can't mix restaurants).
  const [restaurantId, setRestaurantId] = useState(() => {
    const v = localStorage.getItem('cartRestaurant');
    return v ? Number(v) : null;
  });

  // Applied coupon, e.g. { code: 'SAVE10', discount: 45 }
  const [coupon, setCoupon] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cartCoupon') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
    if (restaurantId) localStorage.setItem('cartRestaurant', String(restaurantId));
    else localStorage.removeItem('cartRestaurant');
  }, [items, restaurantId]);

  useEffect(() => {
    if (coupon) localStorage.setItem('cartCoupon', JSON.stringify(coupon));
    else localStorage.removeItem('cartCoupon');
  }, [coupon]);

  const applyCoupon = (code, discount, description) => setCoupon({ code, discount, description });
  const removeCoupon = () => setCoupon(null);

  const addItem = (food, restId) => {
    // Adding from a different restaurant resets the cart.
    if (restaurantId && restId && restaurantId !== restId) {
      const ok = window.confirm(
        'Your cart has items from another restaurant. Start a new cart?'
      );
      if (!ok) return false;
      setItems([{ ...food, quantity: 1 }]);
      setRestaurantId(restId);
      return true;
    }
    setRestaurantId(restId || restaurantId);
    setItems((prev) => {
      const found = prev.find((i) => i.id === food.id);
      if (found) {
        return prev.map((i) =>
          i.id === food.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...food, quantity: 1 }];
    });
    return true;
  };

  const decrement = (id) =>
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setCoupon(null);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    const deliveryFee = items.length ? DELIVERY_FEE : 0;
    const taxes = Math.round(subtotal * TAX_RATE);
    const discount = Math.min(coupon?.discount || 0, subtotal);
    const total = Math.max(subtotal + deliveryFee + taxes - discount, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { subtotal, deliveryFee, taxes, discount, total, count };
  }, [items, coupon]);

  return (
    <CartContext.Provider
      value={{
        items, restaurantId, addItem, decrement, removeItem, clearCart, totals,
        coupon, applyCoupon, removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
