"use client";
import { parseHtml } from '@/lib/htmlSanitize';
import { useMemo } from 'react';

type SafeHtmlProps = {
  html: string | undefined;
  className?: string;
};

/**
 * Component to safely render HTML content
 * Sanitizes HTML to prevent XSS attacks
 */
export default function SafeHtml({ html, className = '' }: SafeHtmlProps) {
  const sanitized = useMemo(() => parseHtml(html), [html]);
  
  if (!sanitized) return null;
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}


