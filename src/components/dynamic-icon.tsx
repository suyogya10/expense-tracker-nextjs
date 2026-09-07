'use client';

import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
  name?: string | null;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name, className = 'w-4 h-4', size = 16, ...props }: DynamicIconProps) {
  if (!name) {
    const Fallback = Icons.Tag;
    return <Fallback className={className} size={size} {...props} />;
  }

  // Convert to PascalCase if needed
  const formattedName = name
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<any>>)[formattedName] ||
    (Icons as unknown as Record<string, React.ComponentType<any>>)[name] ||
    Icons.Tag;

  return <IconComponent className={className} size={size} {...props} />;
}
