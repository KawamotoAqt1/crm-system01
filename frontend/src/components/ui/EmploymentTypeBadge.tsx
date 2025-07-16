import React from 'react';
import { Badge } from './Badge';

type EmploymentType = 'FULL_TIME' | 'CONTRACT' | 'PART_TIME' | 'INTERN';

interface EmploymentTypeBadgeProps {
  type: EmploymentType;
  className?: string;
}

const EMPLOYMENT_TYPE_CONFIG = {
  FULL_TIME: { label: '正社員', variant: 'success' as const },
  CONTRACT: { label: '契約社員', variant: 'primary' as const },
  PART_TIME: { label: 'パート', variant: 'warning' as const },
  INTERN: { label: 'インターン', variant: 'info' as const }
};

export const EmploymentTypeBadge: React.FC<EmploymentTypeBadgeProps> = ({ type, className }) => {
  const config = EMPLOYMENT_TYPE_CONFIG[type];
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}; 