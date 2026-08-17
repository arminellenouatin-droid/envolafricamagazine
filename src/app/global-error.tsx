'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#fcf9f8', color: '#2b2525' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', textAlign: 'center' }}>
          <section>
            <p style={{ color: '#9e001f', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', fontSize: '.7rem' }}>Envol Africa Magazine</p>
            <h1 style={{ fontSize: '2.2rem', margin: '.8rem 0' }}>Une erreur temporaire est survenue.</h1>
            <p style={{ color: '#746665', maxWidth: '34rem', lineHeight: 1.6 }}>Rechargez la page ou réessayez dans quelques instants.</p>
            <button type="button" onClick={() => reset()} style={{ marginTop: '1.5rem', border: 0, background: '#9e001f', color: '#fff', padding: '.8rem 1.2rem', fontWeight: 700, cursor: 'pointer' }}>Réessayer</button>
          </section>
        </main>
      </body>
    </html>
  );
}
