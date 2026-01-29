'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  stat?: string;
  statLabel?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  stat,
  statLabel,
  children,
  className,
  onClick,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        'group bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
            iconBg
          )}
        >
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
        {stat && (
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{stat}</div>
            {statLabel && (
              <div className="text-xs text-slate-500">{statLabel}</div>
            )}
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>

      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: 'up' | 'down';
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            iconBg
          )}
        >
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {change !== undefined && (
          <span
            className={cn(
              'text-sm font-medium px-2 py-1 rounded-full',
              trend === 'up' || change > 0
                ? 'text-green-700 bg-green-50'
                : 'text-red-700 bg-red-50'
            )}
          >
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>

      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-500">{title}</div>
    </motion.div>
  );
}
