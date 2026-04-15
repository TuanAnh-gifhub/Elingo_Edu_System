import { useState, useEffect } from "react";
import {
  subscriptionService,
  type PackageResponse,
  type CreatePackageRequest,
  type UpdatePackageRequest,
  type UserSubscriptionResponse,
} from "../../../services/subscription/subscriptionService";

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const formatCurrency = (v: number) => Number(v).toLocaleString("vi-VN") + " ₫";
const formatDate = (s: string) => new Date(s).toLocaleDateString("vi-VN");

const statusBadge: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-500",
};

const EMPTY_FORM: CreatePackageRequest = {
  name: "",
  description: "",
  price: 0,
  durationDays: 30,
  maxClassesPerMonth: undefined,
  maxCourses: undefined,
};

const AdminPackageManagementPage = () => {
  // -- Packages state --
  const [packages, setPackages] = useState<PackageResponse[]>([]);
  const [pkgLoading, setPkgLoading] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const [pkgSuccess, setPkgSuccess] = useState<string | null>(null);

  // -- Form state --
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePackageRequest>({ ...EMPTY_FORM });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // -- Subscriptions state --
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionResponse[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);

  // -- Tab --
  const [tab, setTab] = useState<"packages" | "subscriptions">("packages");

  // ==================== Fetch ====================
  const fetchPackages = async () => {
    setPkgLoading(true);
    setPkgError(null);
    try {
      const res = await subscriptionService.getAllPackages(1, 100);
      setPackages(res.data.result?.data ?? []);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setPkgError(err?.response?.data?.message ?? "Không thể tải danh sách gói.");
    } finally {
      setPkgLoading(false);
    }
  };

  const fetchSubscriptions = async (page = 1) => {
    setSubLoading(true);
    setSubError(null);
    try {
      const res = await subscriptionService.getAllSubscriptions(page, 20);
      const result = res.data.result;
      setSubscriptions(result?.data ?? []);
      setSubTotalPages(result?.totalPages ?? 1);
      setSubPage(result?.currentPage ?? 1);
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setSubError(err?.response?.data?.message ?? "Không thể tải danh sách đơn mua.");
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchSubscriptions();
  }, []);

  // ==================== Form actions ====================
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (pkg: PackageResponse) => {
    setEditingId(pkg.packageId);
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      price: pkg.price,
      durationDays: pkg.durationDays,
      maxClassesPerMonth: pkg.maxClassesPerMonth ?? undefined,
      maxCourses: pkg.maxCourses ?? undefined,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Tên gói không được để trống."); return; }
    if (form.price <= 0) { setFormError("Giá phải lớn hơn 0."); return; }
    if (form.durationDays < 1) { setFormError("Số ngày phải ≥ 1."); return; }

    setFormLoading(true);
    setFormError(null);
    try {
      if (editingId) {
        const payload: UpdatePackageRequest = { ...form };
        await subscriptionService.updatePackage(editingId, payload);
        setPkgSuccess("Cập nhật gói thành công!");
      } else {
        await subscriptionService.createPackage(form);
        setPkgSuccess("Tạo gói mới thành công!");
      }
      setShowForm(false);
      await fetchPackages();
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setFormError(err?.response?.data?.message ?? "Lưu thất bại.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (pkg: PackageResponse) => {
    try {
      await subscriptionService.updatePackage(pkg.packageId, { active: !pkg.active });
      setPkgSuccess(`Đã ${pkg.active ? "ẩn" : "kích hoạt"} gói "${pkg.name}".`);
      await fetchPackages();
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setPkgError(err?.response?.data?.message ?? "Thao tác thất bại.");
    }
  };

  const handleDelete = async (pkg: PackageResponse) => {
    if (!confirm(`Bạn có chắc muốn xóa gói "${pkg.name}"?`)) return;
    try {
      await subscriptionService.deletePackage(pkg.packageId);
      setPkgSuccess(`Đã xóa gói "${pkg.name}".`);
      await fetchPackages();
    } catch (e: unknown) {
      const err = e as ErrorWithResponse;
      setPkgError(err?.response?.data?.message ?? "Xóa thất bại.");
    }
  };

  // ==================== UI ====================
  const inputCls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý gói đăng ký</h1>
          <p className="text-sm text-gray-500 mt-1">Tạo, chỉnh sửa gói và xem đơn mua của người dùng</p>
        </div>
        {tab === "packages" && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
          >
            <span>+</span> Tạo gói mới
          </button>
        )}
      </div>

      {/* Alerts */}
      {pkgSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center justify-between">
          <span>{pkgSuccess}</span>
          <button onClick={() => setPkgSuccess(null)} className="ml-4 text-emerald-400 hover:text-emerald-600 text-base leading-none">&times;</button>
        </div>
      )}
      {pkgError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{pkgError}</span>
          <button onClick={() => setPkgError(null)} className="ml-4 text-red-400 hover:text-red-600 text-base leading-none">&times;</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(["packages", "subscriptions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition ${
              tab === t
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t === "packages" ? `Danh sách gói (${packages.length})` : "Đơn mua của người dùng"}
          </button>
        ))}
      </div>

      {/* ====== TAB: PACKAGES ====== */}
      {tab === "packages" && (
        <>
          {pkgLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">Chưa có gói nào. Hãy tạo gói đầu tiên.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.packageId}
                  className={`border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition ${
                    !pkg.active ? "opacity-60" : ""
                  }`}
                >
                  {/* Status strip */}
                  <div className={`h-1 w-full rounded-full mb-4 ${pkg.active ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gray-300"}`} />

                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">{pkg.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${pkg.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {pkg.active ? "Hoạt động" : "Ẩn"}
                    </span>
                  </div>

                  {pkg.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{pkg.description}</p>
                  )}

                  <div className="space-y-1 text-sm text-gray-600 mb-5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Giá</span>
                      <span className="font-bold text-blue-600">{formatCurrency(pkg.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Thời hạn</span>
                      <span>{pkg.durationDays} ngày</span>
                    </div>
                    {pkg.maxClassesPerMonth != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lớp/tháng</span>
                        <span>{pkg.maxClassesPerMonth}</span>
                      </div>
                    )}
                    {pkg.maxCourses != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Khóa học</span>
                        <span>{pkg.maxCourses}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tạo lúc</span>
                      <span>{formatDate(pkg.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="flex-1 py-2 text-sm font-medium rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 transition"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleToggleActive(pkg)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border transition ${
                        pkg.active
                          ? "border-orange-400 text-orange-600 hover:bg-orange-50"
                          : "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {pkg.active ? "Ẩn" : "Hiện"}
                    </button>
                    <button
                      onClick={() => handleDelete(pkg)}
                      className="flex-1 py-2 text-sm font-medium rounded-lg border border-red-400 text-red-600 hover:bg-red-50 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ====== TAB: SUBSCRIPTIONS ====== */}
      {tab === "subscriptions" && (
        <>
          {subLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {subError && (
                <p className="text-sm text-red-600">{subError}</p>
              )}
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Người dùng</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Gói</th>
                      <th className="px-4 py-3">Đã thanh toán</th>
                      <th className="px-4 py-3">Ngày bắt đầu</th>
                      <th className="px-4 py-3">Ngày kết thúc</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">
                          Chưa có đơn mua nào.
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((sub) => {
                        const st = statusBadge[sub.status] ?? statusBadge.EXPIRED;
                        return (
                          <tr key={sub.subscriptionId} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium text-gray-900">{sub.userName}</td>
                            <td className="px-4 py-3 text-gray-500">{sub.userEmail}</td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-blue-600">{sub.packageName}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {formatCurrency(sub.amountPaid)}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{formatDate(sub.startDate)}</td>
                            <td className="px-4 py-3 text-gray-500">{formatDate(sub.endDate)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${st}`}>
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {subTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    disabled={subPage <= 1}
                    onClick={() => fetchSubscriptions(subPage - 1)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-gray-600">
                    Trang {subPage} / {subTotalPages}
                  </span>
                  <button
                    disabled={subPage >= subTotalPages}
                    onClick={() => fetchSubscriptions(subPage + 1)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    Tiếp
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ====== MODAL: Create/Edit Form ====== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal header */}
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Chỉnh sửa gói" : "Tạo gói mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div>
                <label className={labelCls}>Tên gói <span className="text-red-500">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Gói Cơ Bản, Gói Premium..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Mô tả</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Mô tả ngắn về gói..."
                  className={inputCls + " resize-none"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Giá (₫) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1000}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Số ngày <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={form.durationDays}
                    onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Lớp học/tháng (tuỳ chọn)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxClassesPerMonth ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxClassesPerMonth: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="Không giới hạn"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Số khóa học (tuỳ chọn)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxCourses ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxCourses: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="Không giới hạn"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm shadow-md"
                >
                  {formLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Đang lưu...
                    </span>
                  ) : editingId ? "Cập nhật" : "Tạo gói"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackageManagementPage;
