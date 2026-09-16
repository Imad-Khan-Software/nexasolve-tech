import { useNavigate } from 'react-router-dom';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { Container } from '../../components/layout/Container.jsx';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <Container className="py-16">
      <ErrorState
        title="Page not found"
        message="There's nothing at this address."
        onRetry={() => navigate('/')}
        retryLabel="Go home"
      />
    </Container>
  );
}
