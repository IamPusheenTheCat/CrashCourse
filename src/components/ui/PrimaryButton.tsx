import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'accent' | 'outline';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'> & {
  variant?: Variant;
  className?: string;
  loading?: boolean;
  icon?: ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
};

const variants: Record<Variant, string> = {
  accent:
    'bg-cc-accent text-white shadow-lg shadow-[0_10px_36px_rgba(233,69,96,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cc-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cc-surface',
  outline:
    'border border-cc-border text-cc-fg bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cc-muted/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cc-surface',
};

const base =
  'w-full font-semibold flex items-center justify-center gap-2 rounded-xl py-3.5 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:active:scale-100';

/** 主操作（登录、教程 CTA）或次级描边（如 Log out） */
export default function PrimaryButton({
  variant = 'accent',
  className = '',
  loading = false,
  icon,
  children,
  disabled,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <i className="fas fa-circle-notch fa-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
