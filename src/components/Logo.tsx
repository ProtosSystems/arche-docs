export function Logo({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={`text-2xl font-normal tracking-tight text-[color:var(--docs-text)]${className ? ` ${className}` : ''}`}
      {...props}
    >
      <span className="mr-[1px]">⍺</span>
      rche
    </span>
  )
}
