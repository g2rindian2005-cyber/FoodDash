import { motion } from 'framer-motion';

// Wraps every page for a consistent fade/slide transition.
export default function Page({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`mx-auto w-full max-w-6xl px-4 py-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}
