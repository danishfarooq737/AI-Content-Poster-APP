import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, accent = false, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className="card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
          <p className={`mt-2 font-mono text-3xl font-semibold ${accent ? 'text-accent-pink' : 'text-text-primary'}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-raised">
            <Icon className="h-4 w-4 text-text-secondary" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
