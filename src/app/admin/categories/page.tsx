"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, Edit, Trash2, Save, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  _count?: { cases: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", sortOrder: 0 });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch {}
    setLoading(false);
  }

  async function createCategory() {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      toast({ title: "分类已创建" });
      setShowCreate(false);
      setForm({ name: "", description: "", sortOrder: 0 });
      fetchCategories();
    } catch (err) {
      toast({ title: "创建失败", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  }

  async function updateCategory(id: string) {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      toast({ title: "分类已更新" });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast({ title: "更新失败", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("确定要删除这个分类吗？")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      toast({ title: "分类已删除" });
      fetchCategories();
    } catch (err) {
      toast({ title: "删除失败", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description || "", sortOrder: cat.sortOrder });
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-stone-500" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-100">分类管理</h1>
        <Button onClick={() => { setShowCreate(true); setForm({ name: "", description: "", sortOrder: 0 }); }}>
          <Plus className="h-4 w-4 mr-1" /> 新建分类
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="p-4 rounded-lg border border-amber-800/30 bg-stone-900/30 mb-6 space-y-3">
          <div>
            <Label className="text-stone-300">名称</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 bg-stone-900/50 border-stone-700 text-stone-100" />
          </div>
          <div>
            <Label className="text-stone-300">描述</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 bg-stone-900/50 border-stone-700 text-stone-100 resize-none" />
          </div>
          <div>
            <Label className="text-stone-300">排序</Label>
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="mt-1 bg-stone-900/50 border-stone-700 text-stone-100 w-24" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={createCategory}><Save className="h-4 w-4 mr-1" /> 创建</Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}><X className="h-4 w-4 mr-1" /> 取消</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 rounded-lg border border-stone-800/60 bg-stone-900/30">
            {editingId === cat.id ? (
              <div className="space-y-3">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-stone-900/50 border-stone-700 text-stone-100" />
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="bg-stone-900/50 border-stone-700 text-stone-100 resize-none" />
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="bg-stone-900/50 border-stone-700 text-stone-100 w-24" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateCategory(cat.id)}><Save className="h-4 w-4 mr-1" /> 保存</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-4 w-4 mr-1" /> 取消</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-100 font-medium">{cat.name}</span>
                    <span className="text-xs text-stone-500">({cat._count?.cases || 0} 案例)</span>
                  </div>
                  {cat.description && <p className="text-sm text-stone-400 mt-1">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(cat)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteCategory(cat.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
