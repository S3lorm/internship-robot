'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '600px', margin: '0 auto' }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {error.message || 'An unexpected error occurred.'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ background: '#f5f5f5', padding: '1rem', overflow: 'auto', fontSize: '12px' }}>
              {error.stack}
            </pre>
          )}
          <button
            type="button"
            onClick={() => reset()}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
