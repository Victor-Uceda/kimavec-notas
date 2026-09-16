import React from 'react';
import { Folder, Calendar } from 'lucide-react';

interface PriorityBadgeProps {
  children: React.ReactNode;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ children }) => {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-badge text-badge font-medium bg-app-badge-highBg text-app-badge-highText tracking-tight select-none">
      {children}
    </span>
  );
};

interface TagBadgeProps {
  label: string;
  icon?: React.ReactNode;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ label, icon }) => {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-badge text-badge font-medium bg-app-badge-tagBg text-app-badge-tagText tracking-tight select-none">
      {icon || <Folder className="w-3 h-3 text-app-badge-tagText shrink-0" />}
      <span>{label}</span>
    </span>
  );
};

interface DateBadgeProps {
  date: string;
}

export const DateBadge: React.FC<DateBadgeProps> = ({ date }) => {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-badge text-badge font-medium bg-blue-50 text-blue-700 tracking-tight select-none">
      <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
      <span>{date}</span>
    </span>
  );
};
