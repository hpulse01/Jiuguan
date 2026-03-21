"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, Edit, Trash2, Save, X } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  _count?: { cases: number };
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => { fetchTags(); }, []);

  async function fetchTags() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tags");
      const data = await res.json();
      setTags(Array.isArray(data) ? data : data.tags || []);
    } catch {}
    setLoading(false);
  }

  async function createTag() {
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      toast({ title: "标签已创建" });
      setShowCreate(false);
      setName("");
      fetchTags();
    } catch (err) {
      toast({ title: "创建失败", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  }

  async function updateTag(id: string) {
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      toast({ title: "标签已更新" });
      setEditingId(null);
      fetchTags();
    } catch (err) {
      toast({ title: "更新失败", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  }

  async function deleteTag(id: string) {
    if (!confirm("确定要删除这个标签吗？")) return;
    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      toast({ title: "标签已删除" });
      fetchTags();
    } catch (err) {
      toast({ title: "删除失败", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-stone-500" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-100">标签管理</h1>
        <Button onClick={() => { setShowCreate(true); setName(""); }}>
          <Plus className="h-4 w-4 mr-1" /> 新建标签
        </Button>
      </div>

      {showCreate && (
        <div className="p-4 rounded-lg border border-amber-800/30 bg-stone-900/30 mb-6 space-y-3">
          <div>
            <Label className="text-stone-300">名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-stone-900/50 border-stone-700 text-stone-100" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={createTag}><Save className="h-4 w-4 mr-1" /> 创建</Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}><X className="h-4 w-4 mr-1" /> 取消</Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-800/60 bg-stone-900/30">
            {editingId === tag.id ? (
              <div className="flex items-center gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-32 bg-stone-900/50 border-stone-700 text-stone-100 text-sm" />
                <Button variant="ghost" size="sm" onClick={() => updateTag(tag.id)}><Save className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            ) : (
              <>
                <span className="text-sm text-stone-200">{tag.name}</span>
                <span className="text-xs text-stone-500">({tag._count?.cases || 0})</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingId(tag.id); setName(tag.name); }}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-300" onClick={() => deleteTag(tag.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
