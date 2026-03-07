import { ApiReference } from '@/components/ApiReference'
import { resolveOpenApiUrl } from '@/lib/openapi'

export const metadata = {
  title: 'API Reference',
  description: 'Explore the Arche OpenAPI contract rendered via Scalar.',
}

export default function ReferencePage() {
  let openApiUrl = resolveOpenApiUrl()

  return (
    <>
      <ApiReference openApiUrl={openApiUrl} />
    </>
  )
}
