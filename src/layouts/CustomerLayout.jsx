import { Outlet, Link } from 'react-router-dom';
import { Container } from '../components/layout/Container.jsx';

export function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <Container className="flex h-14 items-center justify-between">
          <span className="font-display text-sm font-semibold text-foreground">
            NexaSolve Tech
          </span>
          <Link to="/" className="text-sm text-foreground-muted hover:text-foreground">
            ← Back to site
          </Link>
        </Container>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
