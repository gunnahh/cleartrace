import type { ReactNode } from 'react'
import { Button, Card, Flex, Separator, Text } from '@radix-ui/themes'

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="login" id="main">
      <Card size="4">
        <div className="brand centered">
          <span className="brandmark">C</span>
          <span>
            ClearTrace<small>Company research workspace</small>
          </span>
        </div>
        {children}
      </Card>
    </main>
  )
}

export function GoogleButton({ onUnavailable }: { onUnavailable: () => void }) {
  return (
    <Button type="button" size="3" variant="soft" highContrast onClick={onUnavailable}>
      <span className="google-mark" aria-hidden="true">
        G
      </span>
      Continue with Google
    </Button>
  )
}

export function AuthDivider() {
  return (
    <Flex align="center" gap="3">
      <Separator size="4" />
      <Text size="1" color="gray">
        OR
      </Text>
      <Separator size="4" />
    </Flex>
  )
}
