import { cn } from '@/lib/utils'

export default function Logo({ size = 'default', light = false, className }) {
  const isSmall = size === 'sm'
  const isLarge = size === 'lg'

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary font-black text-primary-foreground',
          isSmall ? 'size-7 text-sm' : isLarge ? 'size-11 text-xl' : 'size-9 text-base'
        )}
      >
        O
      </div>
      <span
        className={cn(
          'font-bold tracking-tight',
          isSmall ? 'text-sm' : isLarge ? 'text-2xl' : 'text-lg',
          light ? 'text-white' : 'text-foreground'
        )}
      >
        Opex{' '}
        <span className={cn('font-medium', light ? 'text-white/70' : 'text-muted-foreground')}>
          Organization
        </span>
      </span>
    </div>
  )
}
