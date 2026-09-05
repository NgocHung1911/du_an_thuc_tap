import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Shield, CheckCircle2, RefreshCw, Search,
  Filter, X, Edit3, AlertCircle, Inbox
} from 'lucide-react';
import { userApi, UserRequest } from '../../services/userApi';
import { UserDTO } from '../../services/taskApi';
import { UserFormModal } from '../../components/admin/UserFormModal';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<UserDTO | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getAllUsers();
      setUsers(data || []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      setError('Không thể tải danh sách người dùng. Vui lòng kiểm tra kết nối hệ thống.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase();
    return users.filter((u) => {
      const uname = (u.username || '').toLowerCase();
      const uemail = (u.email || '').toLowerCase();
      const ufull = (u.fullName || '').toLowerCase();

      const matchesSearch = !query || uname.includes(query) || uemail.includes(query) || ufull.includes(query);
      const matchesRole = filterRole === 'ALL' || (u.role && u.role.toUpperCase() === filterRole.toUpperCase());

      return matchesSearch && matchesRole;
    });
  }, [users, searchKeyword, filterRole]);

  // Form Submit Handler (Create / Update)
  const handleFormSubmit = async (data: UserRequest, userId?: number) => {
    if (userId) {
      await userApi.updateUser(userId, data);
      showToast(`Đã cập nhật thông tin người dùng #${userId}!`, 'success');
    } else {
      await userApi.createUser(data);
      showToast('Đã tạo tài khoản người dùng mới thành công!', 'success');
    }
    await fetchUsers();
  };



  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">👥 Quản Lý Người Dùng</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Danh sách tài khoản và phân quyền người dùng trong hệ thống
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={fetchUsers}
            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Tải lại danh sách"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            onClick={() => {
              setUserToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all hover:shadow-md"
          >
            <UserPlus size={18} />
            <span>Thêm Người Dùng</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Search/Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo username, tên, email..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 shrink-0">Vai trò:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none cursor-pointer focus:border-blue-600 transition-colors"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MEMBER">MEMBER</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table & Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-slate-100 rounded-lg w-full"></div>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-12 bg-slate-50 rounded-lg w-full"></div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Inbox size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Không tìm thấy người dùng phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchKeyword || filterRole !== 'ALL'
              ? 'Vui lòng thử tìm kiếm bằng từ khóa khác hoặc đặt lại bộ lọc.'
              : 'Chưa có người dùng nào trong hệ thống.'}
          </p>
          {(searchKeyword || filterRole !== 'ALL') && (
            <button
              onClick={() => {
                setSearchKeyword('');
                setFilterRole('ALL');
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Tên người dùng</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Vai trò (Role)</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isAdminRole = u.role && u.role.toUpperCase().includes('ADMIN');

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${isAdminRole ? 'bg-indigo-600' : 'bg-blue-600'
                              }`}
                          >
                            {getInitials(u.fullName || u.username)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{u.fullName || u.username}</p>
                            <p className="text-xs text-slate-400 font-mono">Username: {u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${isAdminRole
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                        >
                          <Shield size={12} />
                          {isAdminRole ? 'ROLE_ADMIN' : 'ROLE_MEMBER'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 size={14} /> Hoạt động
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setUserToEdit(u);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Form Modal (Create / Edit) */}
      <UserFormModal
        isOpen={isFormModalOpen}
        userToEdit={userToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setUserToEdit(null);
        }}
        onSubmit={handleFormSubmit}
      />



      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-bold transition-all animate-in fade-in slide-in-from-bottom-5 duration-200 ${toast.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-900'
              : 'bg-red-800 text-white border-red-900'
            }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/20 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
