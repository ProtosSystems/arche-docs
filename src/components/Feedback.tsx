'use client'

import { Transition } from '@headlessui/react'
import clsx from 'clsx'
import { forwardRef, useState } from 'react'

function CheckIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="10" strokeWidth="0" />
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="m6.75 10.813 2.438 2.437c1.218-4.469 4.062-6.5 4.062-6.5"
      />
    </svg>
  )
}

function FeedbackButton(
  props: Omit<React.ComponentPropsWithoutRef<'button'>, 'type' | 'className'>,
) {
  return (
    <button
      type="submit"
      className="px-3 text-sm font-medium text-[color:var(--docs-muted)] transition hover:bg-[color:var(--docs-hover)] hover:text-[color:var(--docs-text)]"
      {...props}
    />
  )
}

const FeedbackForm = forwardRef<
  React.ElementRef<'form'>,
  React.ComponentPropsWithoutRef<'form'>
>(function FeedbackForm({ onSubmit, className, ...props }, ref) {
  return (
    <form
      {...props}
      ref={ref}
      onSubmit={onSubmit}
      className={clsx(
        className,
        'absolute inset-0 flex items-center justify-center gap-6 md:justify-start',
      )}
    >
      <p className="text-sm text-[color:var(--docs-muted)]">
        Was this page helpful?
      </p>
      <div className="group grid h-8 grid-cols-[1fr_1px_1fr] overflow-hidden rounded-full border border-[color:var(--docs-border)]">
        <FeedbackButton data-response="yes">Yes</FeedbackButton>
        <div className="bg-[color:var(--docs-border)]" />
        <FeedbackButton data-response="no">No</FeedbackButton>
      </div>
    </form>
  )
})

const FeedbackThanks = forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(function FeedbackThanks({ className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={clsx(
        className,
        'absolute inset-0 flex justify-center md:justify-start',
      )}
    >
      <div className="flex items-center gap-3 rounded-full bg-[color:var(--docs-surface)] py-1 pr-3 pl-1.5 text-sm text-[color:var(--docs-text)] ring-1 ring-[color:var(--docs-border)] ring-inset dark:bg-[color:var(--docs-surface)] dark:text-[color:var(--docs-text)] dark:ring-[color:var(--docs-border)]">
        <CheckIcon className="h-5 w-5 flex-none fill-[color:var(--docs-link)] stroke-white dark:fill-[color:var(--docs-border)] dark:stroke-[color:var(--docs-text)]" />
        Thanks for your feedback!
      </div>
    </div>
  )
})

export function Feedback() {
  let [submitted, setSubmitted] = useState(false)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // event.nativeEvent.submitter.dataset.response
    // => "yes" or "no"

    setSubmitted(true)
  }

  return (
    <div className="relative h-8">
      <Transition show={!submitted}>
        <FeedbackForm
          className="duration-300 data-closed:opacity-0 data-leave:pointer-events-none"
          onSubmit={onSubmit}
        />
      </Transition>
      <Transition show={submitted}>
        <FeedbackThanks className="delay-150 duration-300 data-closed:opacity-0" />
      </Transition>
    </div>
  )
}
