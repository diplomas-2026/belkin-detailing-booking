import { cn } from '../../lib/utils'

export default function ShinyButton({ as: Comp = 'button', className, children, ...props }) {
  return (
    <Comp
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 font-semibold text-white',
        'bg-gradient-to-b from-violet-500 to-violet-600 shadow-[0_14px_30px_rgba(124,58,237,0.25)]',
        'transition hover:-translate-y-0.5 active:translate-y-0',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100',
          'bg-[radial-gradient(120px_90px_at_20%_10%,rgba(255,255,255,0.40),transparent_60%),radial-gradient(200px_140px_at_90%_30%,rgba(255,255,255,0.20),transparent_65%)]',
        )}
      />
      <span aria-hidden="true" className="pointer-events-none absolute -inset-[2px] animate-shimmer bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.22),transparent)]" />
      <span className="relative z-10">{children}</span>
    </Comp>
  )
}

