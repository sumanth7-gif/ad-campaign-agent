export default function HomePage() {
  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h1>RadicAI Ad Agent API</h1>
      <p>API server running. Use POST /api/chat/completions to generate campaign plans.</p>
      <p>
        <strong>Endpoint:</strong> <code>POST /api/chat/completions</code>
      </p>
      <p>
        <strong>Example:</strong> See <code>examples/brief1.json</code> for input format.
      </p>
    </div>
  );
}

