// صفحة إدارة البنوك - إضافة وتعديل وحذف البنوك
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBanks, useCreateBank, useUpdateBank, useDeleteBank,
  getListBanksQueryKey
} from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";
import { Plus, Pencil, Trash2, X, Check, Building2, ToggleLeft, ToggleRight } from "lucide-react";
import type { Bank } from "@workspace/api-client-react";

const emptyForm = { name: "", nameAr: "", logoUrl: "", isActive: true, sortOrder: 0 };

export default function AdminBanksPage() {
  const queryClient = useQueryClient();
  const { data: banks, isLoading } = useListBanks();
  const createBank = useCreateBank();
  const updateBank = useUpdateBank();
  const deleteBank = useDeleteBank();

  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingBank(null);
    setShowForm(false);
    setError(null);
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setForm({ name: bank.name, nameAr: bank.nameAr, logoUrl: bank.logoUrl || "", isActive: bank.isActive, sortOrder: bank.sortOrder });
    setShowForm(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim()) { setError("اسم البنك بالعربي مطلوب"); return; }
    setSaving(true);
    setError(null);
    try {
      if (editingBank) {
        await updateBank.mutateAsync({ id: editingBank.id, data: form });
      } else {
        await createBank.mutateAsync({ data: { ...form, name: form.name || form.nameAr } });
      }
      queryClient.invalidateQueries({ queryKey: getListBanksQueryKey() });
      resetForm();
    } catch {
      setError("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, nameAr: string) => {
    if (!confirm(`هل أنت متأكد من حذف بنك "${nameAr}"؟`)) return;
    await deleteBank.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListBanksQueryKey() });
  };

  const handleToggleActive = async (bank: Bank) => {
    await updateBank.mutateAsync({ id: bank.id, data: { ...bank, isActive: !bank.isActive } });
    queryClient.invalidateQueries({ queryKey: getListBanksQueryKey() });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        {/* الرأس */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-foreground">إدارة البنوك</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {banks?.length ?? 0} بنك مسجل • {banks?.filter(b => b.isActive).length ?? 0} نشط
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 navy-gradient text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            إضافة بنك جديد
          </button>
        </div>

        {/* نموذج الإضافة/التعديل */}
        {showForm && (
          <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-black text-lg text-foreground">
                {editingBank ? `تعديل: ${editingBank.nameAr}` : "إضافة بنك جديد"}
              </h3>
              <button onClick={resetForm} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm font-medium">{error}</div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5">اسم البنك بالعربي <span className="text-destructive">*</span></label>
                  <input
                    required
                    type="text"
                    value={form.nameAr}
                    onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                    className="w-full border rounded-xl p-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="مثال: بنك قطر الوطني"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">اسم البنك بالإنجليزي</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-xl p-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="مثال: Qatar National Bank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">رابط الشعار (URL)</label>
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                    className="w-full border rounded-xl p-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="https://..."
                  />
                  {form.logoUrl && (
                    <img src={form.logoUrl} alt="معاينة الشعار" className="mt-2 h-10 object-contain rounded" onError={e => (e.currentTarget.style.display = "none")} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">ترتيب العرض</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="w-full border rounded-xl p-3 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <input
                  type="checkbox"
                  id="isActiveForm"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="isActiveForm" className="font-bold text-sm cursor-pointer">نشط — مرئي للمستخدمين</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 navy-gradient text-white px-7 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {saving ? "جاري الحفظ..." : editingBank ? "حفظ التعديلات" : "إضافة البنك"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="border px-7 py-3 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* قائمة البنوك */}
        <div className="bg-card border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              جاري تحميل البنوك...
            </div>
          ) : !banks || banks.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">لا توجد بنوك مضافة بعد</p>
              <button onClick={() => setShowForm(true)} className="mt-4 text-primary font-bold text-sm hover:underline">إضافة أول بنك</button>
            </div>
          ) : (
            <div className="divide-y">
              {(banks || []).sort((a, b) => a.sortOrder - b.sortOrder).map((bank) => (
                <div key={bank.id} className={`flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors ${!bank.isActive ? "opacity-60" : ""}`}>
                  {/* الشعار */}
                  <div className="shrink-0">
                    {bank.logoUrl ? (
                      <img src={bank.logoUrl} alt={bank.nameAr}
                        className="w-14 h-10 object-contain rounded-lg border bg-white p-1"
                        onError={e => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-12 h-12 navy-gradient rounded-xl flex items-center justify-center text-white font-black text-lg">
                        {bank.nameAr.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* الاسم */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{bank.nameAr}</p>
                    {bank.name && bank.name !== bank.nameAr && (
                      <p className="text-xs text-muted-foreground">{bank.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">ترتيب: {bank.sortOrder}</p>
                  </div>

                  {/* الحالة والإجراءات */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(bank)}
                      title={bank.isActive ? "إيقاف البنك" : "تفعيل البنك"}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${bank.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                      {bank.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      <span className="hidden sm:inline">{bank.isActive ? "نشط" : "متوقف"}</span>
                    </button>
                    <button
                      onClick={() => handleEdit(bank)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="تعديل"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bank.id, bank.nameAr)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
