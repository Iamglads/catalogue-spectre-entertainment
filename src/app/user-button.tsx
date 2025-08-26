"use client";
import { signOut, useSession } from 'next-auth/react';

export default function UserButton() {
  const { data } = useSession();
  const isAuthed = Boolean(data?.user);
  if (!isAuthed) return null;
  return (
    <button
      className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      Se déconnecter
    </button>
  );
}


