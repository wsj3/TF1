export default function MinimalPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Minimal Test Page</h1>
      <p>This is a minimal page with no external dependencies or imports.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  );
} 