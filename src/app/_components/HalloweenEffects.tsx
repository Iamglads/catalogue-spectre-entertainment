"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

/**
 * Halloween special effects - Bats, ghosts, pumpkins glow
 */
export default function HalloweenEffects() {
  const { currentTheme } = useTheme();
  const [bats, setBats] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [ghosts, setGhosts] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    if (currentTheme !== 'halloween') return;

    // Generate random bats
    const newBats = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 30,
      delay: Math.random() * 5,
    }));
    setBats(newBats);

    // Generate random ghosts
    const newGhosts = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      delay: i * 4,
    }));
    setGhosts(newGhosts);
  }, [currentTheme]);

  if (currentTheme !== 'halloween') return null;

  return (
    <>
      {/* Bats and ghosts REMOVED - too distracting */}

      {/* Pumpkin cursor follower - REMOVED (too distracting) */}
      {/* Lightning flash effect - REMOVED for accessibility (epilepsy concerns) */}

    </>
  );
}

// Pumpkin cursor follower REMOVED - too distracting for users
// Lightning flash effect REMOVED for accessibility - flashing lights can trigger seizures in people with photosensitive epilepsy

