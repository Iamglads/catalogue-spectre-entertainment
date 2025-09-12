"use client";
import { signOut, useSession } from 'next-auth/react';

export default function UserButton() {
  const { data } = useSession();
  const isAuthed = Boolean(data?.user);
  if (!isAuthed) return null;
  return (
    <button
      className="btn btn-ghost text-sm"
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      Se déconnecter
    </button>
  );
}


