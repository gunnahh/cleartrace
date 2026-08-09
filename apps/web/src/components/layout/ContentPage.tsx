import { Heading, Text } from '@radix-ui/themes'

type ContentPageProps = {
  title: string
  description: string
}

export function ContentPage({ title, description }: ContentPageProps) {
  return (
    <div className="page">
      <Heading>{title}</Heading>
      <Text color="gray">{description}</Text>
    </div>
  )
}
