import type { ButtonHTMLAttributes } from 'react';

const baseClass =
  'shrink-0 w-10 h-10 rounded-xl bg-cc-fill border border-cc-border flex items-center justify-center text-cc-fg active:scale-95 transition-transform';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  className?: string;
};

/** 顶栏圆形图标按钮（返回等） */
export default function IconCircleButton({ className = '', children, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={`${baseClass} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
