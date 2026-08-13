import type { ReactNode } from 'react'
import { Button, Card, Heading, Separator, Text } from '@radix-ui/themes'
import { BadgeCheck, FileSearch, Fingerprint, ShieldCheck, Sparkles } from 'lucide-react'

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="login auth-page" id="main">
      <div className="auth-shell">
        <aside className="auth-showcase" aria-label="About ClearTrace">
          <div className="auth-showcase__brand">
            <span className="auth-brandmark" aria-hidden="true">
              C
            </span>
            <span>
              ClearTrace<small>Company research workspace</small>
            </span>
          </div>
          <div className="auth-showcase__content">
            <span className="auth-showcase__eyebrow">
              <Sparkles size={13} aria-hidden="true" />
              Research with confidence
            </span>
            <Heading as="h2" size="8">
              A clearer path from evidence to decision.
            </Heading>
            <Text as="p">
              Bring company intelligence, legal records, and media findings into one focused,
              structured workspace.
            </Text>
            <div className="auth-benefits">
              <AuthBenefit
                icon={<FileSearch />}
                title="Evidence-led research"
                description="Keep every finding connected to its recorded source."
              />
              <AuthBenefit
                icon={<BadgeCheck />}
                title="Review-ready reports"
                description="Turn structured research into consistent client deliverables."
              />
              <AuthBenefit
                icon={<Fingerprint />}
                title="Structured workflow"
                description="Keep complex reviews clear from assignment through submission."
              />
            </div>
          </div>
          <div className="auth-showcase__assurance">
            <ShieldCheck size={15} aria-hidden="true" />
            Company research, thoughtfully organized.
          </div>
        </aside>
        <Card className="auth-card" size="4">
          <div className="auth-brand-mobile">
            <span className="auth-brandmark" aria-hidden="true">
              C
            </span>
            <span>
              ClearTrace<small>Company research workspace</small>
            </span>
          </div>
          <div className="auth-card__content">{children}</div>
          <Text className="auth-card__legal" as="p" size="1" color="gray">
            ClearTrace · Company research workspace
          </Text>
        </Card>
      </div>
    </main>
  )
}

export function GoogleButton({
  onUnavailable,
  disabled = false,
}: {
  onUnavailable: () => void
  disabled?: boolean
}) {
  return (
    <Button
      className="auth-google-button"
      type="button"
      size="3"
      variant="soft"
      highContrast
      disabled={disabled}
      onClick={onUnavailable}
    >
      <span className="google-mark" aria-hidden="true">
        G
      </span>
      Continue with Google
    </Button>
  )
}

export function AuthDivider() {
  return (
    <div className="auth-divider">
      <Separator decorative size="4" />
      <Text size="1" color="gray">
        OR
      </Text>
      <Separator decorative size="4" />
    </div>
  )
}

export function AuthHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <header className="auth-heading">
      <span className="auth-heading__eyebrow">{eyebrow}</span>
      <Heading as="h1" size="7">
        {title}
      </Heading>
      <Text as="p" color="gray">
        {description}
      </Text>
    </header>
  )
}

function AuthBenefit({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="auth-benefit">
      <span aria-hidden="true">{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
    </div>
  )
}
