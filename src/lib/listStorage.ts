export type StoredListItem = {
  id: string;
  name: string;
  image?: string;
  shortDescription?: string;
  quantity: number;
};

const KEY_LIST = 'catalogue:list';

export function loadList(): StoredListItem[] {
  try {
    const raw = localStorage.getItem(KEY_LIST);
    if (!raw) return [];
    const arr = JSON.parse(raw) as StoredListItem[];
    if (!Array.isArray(arr)) return [];
    return arr.map((it) => ({ ...it, quantity: Math.max(1, Number(it.quantity) || 1) }));
  } catch {
    return [];
  }
}

export function saveList(list: StoredListItem[]) {
  try {
    localStorage.setItem(KEY_LIST, JSON.stringify(list));
    // notify listeners in the same tab
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('catalogue:list:changed'));
      }
    } catch {}
  } catch {}
}

export function addOrUpdateItem(item: Omit<StoredListItem, 'quantity'>, quantity: number = 1) {
  const list = loadList();
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...item, quantity: Math.max(1, quantity) };
  } else {
    list.push({ ...item, quantity: Math.max(1, quantity) });
  }
  saveList(list);
}

export function removeItem(id: string) {
  const list = loadList().filter((x) => x.id !== id);
  saveList(list);
}

export function setQuantity(id: string, quantity: number) {
  const list = loadList();
  const idx = list.findIndex((x) => x.id === id);
  if (idx >= 0) {
    list[idx].quantity = Math.max(1, Number(quantity) || 1);
    saveList(list);
  }
}

export function clearList() {
  saveList([]);
}

export function getIds(list?: StoredListItem[]): string[] {
  const src = list ?? loadList();
  return src.map((x) => x.id);
}

export function getQuantitiesMap(list?: StoredListItem[]): Record<string, number> {
  const src = list ?? loadList();
  const map: Record<string, number> = {};
  for (const it of src) map[it.id] = Math.max(1, Number(it.quantity) || 1);
  return map;
}


