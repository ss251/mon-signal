'use client'

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fade-in-up">
      <div className="empty-state-icon">
        {icon || (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        )}
      </div>
      <h3 className="font-display text-lg text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-[260px] mb-6">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  )
}
