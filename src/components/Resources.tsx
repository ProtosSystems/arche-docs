'use client'

import Link from 'next/link'

import { Heading } from '@/components/Heading'
import { ChatBubbleIcon } from '@/components/icons/ChatBubbleIcon'
import { EnvelopeIcon } from '@/components/icons/EnvelopeIcon'
import { UserIcon } from '@/components/icons/UserIcon'
import { UsersIcon } from '@/components/icons/UsersIcon'

interface Resource {
  href: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const resources: Array<Resource> = [
  {
    href: '/contacts',
    name: 'Contacts',
    description:
      'Learn about the contact model and how to create, retrieve, update, delete, and list contacts.',
    icon: UserIcon,
  },
  {
    href: '/conversations',
    name: 'Conversations',
    description:
      'Learn about the conversation model and how to create, retrieve, update, delete, and list conversations.',
    icon: ChatBubbleIcon,
  },
  {
    href: '/messages',
    name: 'Messages',
    description:
      'Learn about the message model and how to create, retrieve, update, delete, and list messages.',
    icon: EnvelopeIcon,
  },
  {
    href: '/groups',
    name: 'Groups',
    description:
      'Learn about the group model and how to create, retrieve, update, delete, and list groups.',
    icon: UsersIcon,
  },
]

function ResourceIcon({ icon: Icon }: { icon: Resource['icon'] }) {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--docs-surface)] ring-1 ring-[color:var(--docs-border)] backdrop-blur-[2px] transition duration-300 group-hover:bg-[color:var(--docs-hover)]">
      <Icon className="h-5 w-5 fill-transparent stroke-[color:var(--docs-text)] transition-colors duration-300 group-hover:stroke-[color:var(--docs-link)]" />
    </div>
  )
}

function Resource({ resource }: { resource: Resource }) {
  return (
    <div
      key={resource.href}
      className="group relative flex rounded-2xl bg-[color:var(--docs-surface)] transition-colors duration-200 hover:bg-[color:var(--docs-hover)] dark:bg-[color:var(--docs-surface)] dark:hover:bg-[color:var(--docs-hover)]"
    >
      <div className="absolute inset-0 rounded-2xl ring-1 ring-[color:var(--docs-border)] ring-inset" />
      <div className="relative rounded-2xl px-4 pt-16 pb-4">
        <ResourceIcon icon={resource.icon} />
        <h3 className="mt-4 text-sm/7 font-semibold text-[color:var(--docs-text)]">
          <Link href={resource.href}>
            <span className="absolute inset-0 rounded-2xl" />
            {resource.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-[color:var(--docs-muted)]">
          {resource.description}
        </p>
      </div>
    </div>
  )
}

export function Resources() {
  return (
    <div className="my-16 xl:max-w-none">
      <Heading level={2} id="resources">
        Resources
      </Heading>
      <div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-[color:var(--docs-border)] pt-10 sm:grid-cols-2 xl:grid-cols-4">
        {resources.map((resource) => (
          <Resource key={resource.href} resource={resource} />
        ))}
      </div>
    </div>
  )
}
