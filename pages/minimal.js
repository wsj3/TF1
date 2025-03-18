export default function MinimalPage() {
  return (
    <div style={{ 
      padding: 20,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      lineHeight: 1.5
    }}>
      <h1 style={{ color: '#333', fontSize: '2rem' }}>Minimal Test Page</h1>
      <p>This is a minimal page with no external dependencies or imports.</p>
      <p>Current time: {new Date().toISOString()}</p>
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
        <h2 style={{ fontSize: '1.5rem', marginTop: 0 }}>Environment Info</h2>
        <p>Node Environment: {process.env.NODE_ENV || 'Not set'}</p>
        <p>NextAuth URL: {process.env.NEXTAUTH_URL ? 'Set' : 'Not set'}</p>
        <p>Database URL: {process.env.DATABASE_URL ? 'Set' : 'Not set'}</p>
      </div>
    </div>
  );
} 