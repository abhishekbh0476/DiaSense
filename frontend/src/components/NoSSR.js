'use client';

import { useEffect, useState } from 'react';

/**
 * NoSSR Component - Prevents server-side rendering for wrapped content
 * Useful for components that have hydration mismatches due to browser extensions
 */
export default function NoSSR({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
}
