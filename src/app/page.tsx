export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Searchable</h1>
      <p>AI Search Visibility — Citation Tracking</p>
      <ul>
        <li><code>POST /api/ingest</code> — Ingest AI response (query, model, rawResponseText)</li>
        <li><code>GET /api/citations?domain=...&amp;model=...</code> — List citations with optional filters</li>
      </ul>
    </main>
  );
}
