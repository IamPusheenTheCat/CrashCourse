import IconCircleButton from './IconCircleButton';

type Props = {
  title: string;
  subtitle?: string;
  userEmail?: string | null;
  onBack: () => void;
  backAriaLabel: string;
};

const emailBadgeClass =
  'inline-flex max-w-[min(100%,14rem)] truncate rounded-lg border border-cc-border bg-cc-fill px-2 py-0.5 text-[11px] font-medium leading-none text-cc-muted';

/**
 * 二级页顶栏：返回 + 标题 + 可选邮箱 pill + 副标题（与 Settings / Profile 对齐）
 */
export default function ScreenHeader({ title, subtitle, userEmail, onBack, backAriaLabel }: Props) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <IconCircleButton onClick={onBack} aria-label={backAriaLabel}>
          <i className="fas fa-arrow-left" />
        </IconCircleButton>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h1 className="text-xl font-bold text-cc-fg">{title}</h1>
            {userEmail ? (
              <span className={emailBadgeClass} title={userEmail}>
                {userEmail}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className={`text-cc-muted text-sm ${userEmail ? 'mt-1' : 'mt-0.5'}`}>{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
