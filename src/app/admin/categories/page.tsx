"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

type Category = { _id: string; name: string; fullPath: string; depth: number; parentId: string | null };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function load() {
    const res = await fetch('/api/admin/categories');
    if (res.ok) {
      const j = await res.json();
      setItems(j.items || []);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((c) => c.name.toLowerCase().includes(term) || c.fullPath.toLowerCase().includes(term));
  }, [items, q]);

  type TreeNode = Category & { children: TreeNode[] };

  function buildTree(source: Category[]): TreeNode[] {
    const byId = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];
    for (const c of source) byId.set(c._id, { ...c, children: [] });
    for (const c of source) {
      const node = byId.get(c._id)!;
      if (c.parentId && byId.has(c.parentId)) {
        byId.get(c.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortRec = (list: TreeNode[]) => {
      list.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
      list.forEach((n) => sortRec(n.children));
    };
    sortRec(roots);
    return roots;
  }

  const tree = useMemo(() => buildTree(items), [items]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function CategoryNode({ node }: { node: TreeNode }) {
    const hasChildren = node.children.length > 0;
    const isOpen = expanded.has(node._id) || node.depth === 0;
    return (
      <div>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ paddingLeft: Math.min(node.depth, 6) * 12 }}>
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node._id)}
                className="h-5 w-5 inline-flex items-center justify-center rounded border text-xs leading-none cursor-pointer bg-white hover:bg-gray-50"
                aria-label={isOpen ? 'Réduire' : 'Développer'}
                title={isOpen ? 'Réduire' : 'Développer'}
              >
                {isOpen ? '−' : '+'}
              </button>
            ) : (
              <span className="h-5 w-5 inline-block" />
            )}
            <div className="text-sm truncate">
              <span className="font-medium">{node.name}</span>
              <span className="ml-2 text-xs text-gray-500 truncate hidden sm:inline">{node.fullPath}</span>
            </div>
          </div>
          <Link className="text-xs underline flex-shrink-0" href={`/admin/categories/${node._id}`}>Éditer</Link>
        </div>
        {hasChildren && isOpen && (
          <div className="border-l ml-6">
            {node.children.map((child) => (
              <CategoryNode key={child._id} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-6xl">
      <div className="mb-3"><Link href="/admin" className="text-sm underline">← Retour</Link></div>
      <div className="mb-4 flex items-center gap-2">
        <input className="rounded border px-2 py-1 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche…" />
        <Link href="/admin/categories/new" className="ml-auto inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
          <Plus className="h-4 w-4" />
          Ajouter
        </Link>
      </div>
      <div className="rounded border bg-white text-gray-900">
        {q.trim()
          ? (
            <>
              {filtered.map((c) => (
                <div key={c._id} className="flex items-center justify-between px-3 py-2 border-b">
                  <div className="text-sm"><span className="text-gray-400">{"— ".repeat(c.depth)}</span>{c.name} <span className="ml-2 text-xs text-gray-500">{c.fullPath}</span></div>
                  <Link className="text-xs underline" href={`/admin/categories/${c._id}`}>Éditer</Link>
                </div>
              ))}
              {filtered.length === 0 && <div className="p-3 text-sm text-gray-500">Aucun résultat</div>}
            </>
          ) : (
            tree.map((root) => (
              <CategoryNode key={root._id} node={root} />
            ))
          )
        }
      </div>
    </div>
  );
}


