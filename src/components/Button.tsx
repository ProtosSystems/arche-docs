import clsx from 'clsx'
import Link from 'next/link'

function ArrowIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m11.5 6.5 3 3.5m0 0-3 3.5m3-3.5h-9"
      />
    </svg>
  )
}

const variantStyles = {
  primary:
    'rounded-full bg-[color:var(--brand-navy)] py-1 px-3 text-white ring-1 ring-inset ring-[color:var(--brand-navy)] transition hover:opacity-90',
  secondary:
    'rounded-full bg-[color:var(--docs-surface)] py-1 px-3 text-[color:var(--docs-text)] ring-1 ring-inset ring-[color:var(--docs-border)] transition hover:bg-[color:var(--docs-hover)]',
  filled:
    'rounded-full bg-[color:var(--brand-navy)] py-1 px-3 text-white ring-1 ring-inset ring-[color:var(--brand-navy)] transition hover:opacity-90',
  outline:
    'rounded-full py-1 px-3 text-[color:var(--docs-text)] ring-1 ring-inset ring-[color:var(--docs-border)] transition hover:bg-[color:var(--docs-hover)]',
  text: 'text-[color:var(--docs-link)] hover:text-[color:var(--docs-link-hover)]',
}

type ButtonProps = {
  variant?: keyof typeof variantStyles
  arrow?: 'left' | 'right'
} & (
  | React.ComponentPropsWithoutRef<typeof Link>
  | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
)

export function Button({
  variant = 'primary',
  className,
  children,
  arrow,
  ...props
}: ButtonProps) {
  className = clsx(
    'inline-flex gap-0.5 justify-center overflow-hidden text-sm font-medium transition',
    variantStyles[variant],
    className,
  )

  let arrowIcon = (
    <ArrowIcon
      className={clsx(
        'mt-0.5 h-5 w-5',
        variant === 'text' && 'relative top-px',
        arrow === 'left' && '-ml-1 rotate-180',
        arrow === 'right' && '-mr-1',
      )}
    />
  )

  let inner = (
    <>
      {arrow === 'left' && arrowIcon}
      {children}
      {arrow === 'right' && arrowIcon}
    </>
  )

  if (typeof props.href === 'undefined') {
    return (
      <button className={className} {...props}>
        {inner}
      </button>
    )
  }

  return (
    <Link className={className} {...props}>
      {inner}
    </Link>
  )
}
