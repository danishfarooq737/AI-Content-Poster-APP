import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { FaTiktok, FaYoutube, FaInstagram } from 'react-icons/fa6';
import StatusBadge from '../components/StatusBadge';
import Skeleton from '../components/Skeleton';
import { platformService } from '../services/platformService';

const PROVIDER_META = {
  tiktok: { label: 'TikTok', color: 'from-[#ff0050] to-[#00f2ea]', Icon: FaTiktok },
  youtube: { label: 'YouTube', color: 'from-[#ff0000] to-[#ff5e5e]', Icon: FaYoutube },
  instagram: { label: 'Instagram', color: 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]', Icon: FaInstagram },
};

export default function AccountsPage() {
  const [connected, setConnected] = useState([]);
  const [supported, setSupported] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([platformService.list(), platformService.supported()])
      .then(([c, s]) => {
        setConnected(c.data.platforms);
        setSupported(s.data.providers);
      })
      .catch(() => toast.error('Could not load connected accounts.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleConnect = async (provider) => {
    try {
      const res = await platformService.connect(provider);
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not start ${provider} connection.`);
    }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm('Disconnect this account?')) return;
    try {
      await platformService.disconnect(id);
      toast.success('Disconnected');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Disconnect failed');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Connected Accounts</h1>
        <p className="mt-1 text-sm text-text-secondary">Link the platforms you want to publish to.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {supported.map((p, i) => {
            const meta = PROVIDER_META[p.provider];
            const account = connected.find((c) => c.provider === p.provider);
            return (
              <motion.div
                key={p.provider}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="card flex flex-col"
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${meta.color}`}>
                  <meta.Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display font-semibold text-text-primary">{meta.label}</h3>

                {!p.configured ? (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Not configured on this server yet. Add {p.provider.toUpperCase()} OAuth credentials to .env.
                  </div>
                ) : account ? (
                  <div className="mt-3 flex-1">
                    <p className="mb-3 truncate text-sm text-text-secondary">{account.displayName || account.providerAccountId}</p>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={account.status} />
                      <button onClick={() => handleDisconnect(account._id)} className="btn-ghost p-2 hover:text-danger" aria-label="Disconnect">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => handleConnect(p.provider)} className="btn-secondary mt-4">
                    <ExternalLink className="h-4 w-4" />
                    Connect {meta.label}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}