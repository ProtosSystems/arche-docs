import clsx from 'clsx'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { forwardRef } from 'react'

import { Logo } from '@/components/Logo'
import {
  MobileNavigation,
  useIsInsideMobileNavigation,
  useMobileNavigationStore,
} from '@/components/MobileNavigation'
import { Button } from '@/components/Button'
import { MobileSearch, Search } from '@/components/Search'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CloseButton } from '@headlessui/react'

export const Header = forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<typeof motion.div>
>(function Header({ className, ...props }, ref) {
  let { isOpen: mobileNavIsOpen } = useMobileNavigationStore()
  let isInsideMobileNavigation = useIsInsideMobileNavigation()

  return (
    <motion.div
      {...props}
      ref={ref}
      className={clsx(
        className,
        'pointer-events-auto fixed inset-x-0 top-0 z-[2147483646] flex h-14 items-center justify-between gap-12 px-4 transition sm:px-6 lg:left-72 lg:z-[2147483646] lg:px-8 xl:left-80',
        !isInsideMobileNavigation &&
          'backdrop-blur-xs lg:left-72 xl:left-80 dark:backdrop-blur-sm',
        'bg-[color:var(--docs-bg)]',
      )}
    >
      <div
        className={clsx(
          'absolute inset-x-0 top-full h-px transition',
          (isInsideMobileNavigation || !mobileNavIsOpen) &&
            'bg-[color:var(--docs-border)]',
        )}
      />
      <div className="hidden lg:block lg:max-w-md lg:flex-auto">
        <Search />
      </div>
      <div className="flex items-center gap-5 lg:hidden">
        <MobileNavigation />
        <CloseButton as={Link} href="/docs" aria-label="Documentation">
          <Logo />
        </CloseButton>
      </div>
      <div className="flex items-center gap-5">
        <nav className="hidden md:flex md:items-center md:gap-4">
          <Link
            href="/docs/reference"
            className="text-sm/5 text-[color:var(--docs-muted)] transition hover:text-[color:var(--docs-link-hover)]"
          >
            API Reference
          </Link>
          <Button
            href="https://app.arche.fi"
            variant="primary"
            className="dark:bg-[#cbd5e1] dark:text-[#0b0f1a] dark:ring-[#cbd5e1] dark:hover:bg-[#e2e8f0]"
          >
            Get started
          </Button>
          <Button href="https://app.arche.fi/login" variant="text">
            Sign in
          </Button>
        </nav>
        <div className="hidden md:block md:h-5 md:w-px md:bg-[color:var(--docs-border)]" />
        <div className="flex gap-4">
          <MobileSearch />
          <ThemeToggle />
        </div>
      </div>
    </motion.div>
  )
})
