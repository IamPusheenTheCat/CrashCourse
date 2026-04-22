import type { ButtonHTMLAttributes } from 'react';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'role'> & {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
};

/** 设置页用：避免原生 checkbox 在 WebView 里强制系统蓝，与 cc-accent / 玻璃风格统一 */
export default function SettingsSwitch({ checked, onCheckedChange, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={[
        'flex h-7 w-[2.875rem] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cc-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cc-surface',
        checked ? 'justify-end bg-cc-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]' : 'justify-start border border-cc-border bg-cc-fill',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <span
        className="pointer-events-none h-[1.35rem] w-[1.35rem] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
        aria-hidden
      />
    </button>
  );
}
