import { MessageCircle } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState.jsx';

export function Messages() {
  return (
    <EmptyState
      icon={MessageCircle}
      title="Messaging — coming in a later phase"
      description="Paste a tracking code here once this is built to view and reply to your enquiry thread."
    />
  );
}
