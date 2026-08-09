import { Button, Card, Heading, Text } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
export function SimplePage({ title, text }: { title: string; text: string }) {
  return (
    <div className="page">
      <Heading>{title}</Heading>
      <Text color="gray">{text}</Text>
    </div>
  )
}
export function LoginPage() {
  return (
    <main className="login">
      <Card size="4">
        <div className="brand centered">
          <span className="brandmark">C</span>
          <span>
            ClearTrace<small>Company research workspace</small>
          </span>
        </div>
        <Heading align="center">Welcome back</Heading>
        <Text as="p" align="center" color="gray">
          Continue to your secure research workspace.
        </Text>
        <Button asChild size="3">
          <Link to="/assignments" search={{ q: '', status: 'ALL' }}>
            Continue to workspace
          </Link>
        </Button>
        <Text size="1" align="center" color="gray">
          Demo access · No client data is used
        </Text>
      </Card>
    </main>
  )
}
