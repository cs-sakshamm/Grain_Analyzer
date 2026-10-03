import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Input } from '@/components/common/Input'
import { LoadingIndicator } from '@/components/common/LoadingIndicator'
import { SectionHeader } from '@/components/common/SectionHeader'
import { APP_CONFIG } from '@/config/app'
import { SUPPORTED_CROPS } from '@/config/crops'

function CropsCard() {
  return (
    <Card>
      <h3 className="text-card-title font-semibold text-ink">Supported crops</h3>
      <p className="mt-1 text-helper text-ink-muted">
        Crops are defined centrally in the application configuration.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {SUPPORTED_CROPS.map((crop) => (
          <li
            key={crop.id}
            className="rounded-full border border-border bg-muted px-3.5 py-1.5 text-label font-medium text-ink-secondary"
          >
            {crop.name}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function WorkflowCard() {
  return (
    <Card>
      <h3 className="text-card-title font-semibold text-ink">Planned workflow</h3>
      <p className="mt-1 text-helper text-ink-muted">
        The analysis workflow will be enabled stage by stage in upcoming phases.
      </p>
      <ol className="mt-4 flex flex-wrap items-center gap-2">
        {APP_CONFIG.workflowStages.map((stage, index) => (
          <li key={stage} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="text-ink-disabled">
                →
              </span>
            )}
            <span className="rounded-lg border border-border bg-surface px-3 py-1.5 text-label font-medium text-ink-secondary">
              {stage}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function DesignSystemCard() {
  return (
    <Card>
      <h3 className="text-card-title font-semibold text-ink">Design system reference</h3>
      <p className="mt-1 text-helper text-ink-muted">
        Foundation components and states shared across the application.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <h4 className="text-label font-semibold uppercase tracking-wide text-ink-muted">
            Buttons
          </h4>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="primary" loading>
              Loading
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-label font-semibold uppercase tracking-wide text-ink-muted">
            Inputs
          </h4>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <Input label="Field label" placeholder="Input placeholder" helperText="Helper text" />
            <Input label="Field label" placeholder="Input placeholder" error="Error message" />
          </div>
        </div>

        <div>
          <h4 className="text-label font-semibold uppercase tracking-wide text-ink-muted">
            System states
          </h4>
          <div className="mt-2 grid gap-4 lg:grid-cols-3">
            <div className="flex items-center justify-center rounded-xl border border-border p-6">
              <LoadingIndicator size="sm" />
            </div>
            <div className="rounded-xl border border-border">
              <EmptyState
                title="No data available"
                description="Content will appear here once it is available."
              />
            </div>
            <div className="rounded-xl border border-border">
              <ErrorState
                title="Something went wrong"
                message="An unexpected problem occurred. Please try again."
                action={
                  <Button variant="secondary" size="md">
                    Retry
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Phase 1 foundation page: verifies the shell, configuration, and design system. */
export function HomePage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        as="h1"
        title="System ready"
        description="Frontend foundation of the grain analysis instrument. Analysis functionality is intentionally not enabled yet and will arrive with backend integration in an upcoming phase."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <CropsCard />
        <WorkflowCard />
      </div>
      <DesignSystemCard />
    </div>
  )
}
