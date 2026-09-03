import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, FileText, CalendarClock, CheckCircle2, Trash2, ShieldCheck, Ban } from 'lucide-react';
import StatCard from '../components/StatCard';
import Skeleton from '../components/Skeleton';
import { adminService } from '../services/adminService';
import { useAuthStore } from '../store/authStore';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.user);

  const load = () => {
    setLoading(true);
    Promise.all([adminService.listUsers(), adminService.stats()])
      .then(([u, s]) => {
        setUsers(u.data.users);
        setStats(s.data);
      })
      .catch(() => toast.error('Could not load admin data.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (user) => {
    try {
      await adminService.updateUser(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User reactivated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${user.name} to ${newRole}?`)) return;
    try {
      await adminService.updateUser(user.id, { role: newRole });
      toast.success('Role updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Permanently delete ${user.name}?`)) return;
    try {
      await adminService.deleteUser(user.id);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Admin</h1>
        <p className="mt-1 text-sm text-text-secondary">Platform-wide stats and user management.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard index={0} label="Users" value={stats.userCount} icon={Users} />
          <StatCard index={1} label="Content items" value={stats.contentCount} icon={FileText} />
          <StatCard index={2} label="Pending posts" value={stats.scheduledCount} icon={CalendarClock} accent />
          <StatCard index={3} label="Posted" value={stats.postedCount} icon={CheckCircle2} />
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Users</h2>
        {loading ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u, i) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    >
                      <td className="px-5 py-3 font-medium text-text-primary">
                        {u.name} {isSelf && <span className="text-xs text-text-muted">(you)</span>}
                      </td>
                      <td className="px-5 py-3 text-text-secondary">{u.email}</td>
                      <td className="px-5 py-3 capitalize text-text-secondary">{u.role}</td>
                      <td className="px-5 py-3">
                        <span className={`badge ${u.isActive ? 'border-success/30 text-success' : 'border-border text-text-muted'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            disabled={isSelf}
                            onClick={() => toggleRole(u)}
                            className="btn-ghost p-2 disabled:opacity-30"
                            title="Toggle admin role"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() => toggleActive(u)}
                            className="btn-ghost p-2 disabled:opacity-30"
                            title="Toggle active status"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() => removeUser(u)}
                            className="btn-ghost p-2 hover:text-danger disabled:opacity-30"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
