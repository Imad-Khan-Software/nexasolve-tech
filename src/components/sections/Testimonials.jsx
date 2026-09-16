import { useState } from 'react';
import { Star, MessageSquareQuote, Loader2 } from 'lucide-react';
import { Container } from '../layout/Container.jsx';
import { SectionHeading } from '../layout/SectionHeading.jsx';
import { FormField } from '../ui/FormField.jsx';
import { Button } from '../ui/Button.jsx';
import { Toast } from '../ui/Toast.jsx';
import { useApprovedFeedback } from '../../hooks/useApprovedFeedback.js';
import { submitFeedback } from '../../services/feedbackService.js';

function Stars({ value }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= value ? 'h-4 w-4 fill-accent text-accent' : 'h-4 w-4 text-border-strong'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function FeedbackCard({ item }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-background-surface p-5 shadow-subtle">
      <Stars value={item.rating} />
      <p className="mt-3 flex-1 text-sm text-foreground-muted">"{item.message}"</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{item.name}</span>
        <span className="text-xs text-foreground-subtle">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };
const emptyForm = { name: '', email: '', message: '' };

function FeedbackForm() {
  const [form, setForm] = useState(emptyForm);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | submitted
  const [toast, setToast] = useState(null);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.message.trim()) next.message = 'Please share a few words of feedback.';
    if (rating < 1) next.rating = 'Please choose a rating.';
    if (form.email.trim()) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      if (!isValidEmail) next.email = 'Enter a valid email, or leave it blank.';
    }
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === 'submitting') return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    try {
      await submitFeedback({ ...form, rating });
      setStatus('submitted');
      setForm(emptyForm);
      setRating(0);
      setToast({ type: 'success', message: 'Thanks! Your feedback has been submitted for review.' });
    } catch (err) {
      setStatus('idle');
      setToast({ type: 'error', message: 'Could not submit your feedback. Please try again.' });
      // eslint-disable-next-line no-console
      console.error('Feedback submission failed:', err);
    }
  }

  if (status === 'submitted') {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-6 text-center">
        <p className="font-medium text-foreground">Thank you for your feedback!</p>
        <p className="mt-1 text-sm text-foreground-muted">
          It's been submitted for review and will appear here once approved.
        </p>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => setStatus('idle')}>
          Leave another
        </Button>
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-lg border border-border bg-background-surface p-6">
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">Your rating</p>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Rating"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? '' : 's'} — ${RATING_LABELS[n]}`}
              onClick={() => {
                setRating(n);
                if (errors.rating) setErrors((e) => ({ ...e, rating: undefined }));
              }}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <Star
                className={
                  n <= (hoverRating || rating)
                    ? 'h-6 w-6 fill-accent text-accent'
                    : 'h-6 w-6 text-border-strong'
                }
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-foreground-muted">{RATING_LABELS[rating]}</span>
          )}
        </div>
        {errors.rating && <p className="mt-1 text-xs text-danger">{errors.rating}</p>}
      </div>

      <FormField id="feedback-name" label="Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} />
      <FormField id="feedback-email" label="Email (optional)" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} error={errors.email} />
      <FormField id="feedback-message" label="Feedback" as="textarea" rows={3} value={form.message} onChange={(e) => updateField('message', e.target.value)} error={errors.message} />

      <Button type="submit" isLoading={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Submitting…' : 'Submit Feedback'}
      </Button>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </form>
  );
}

export function Testimonials() {
  const { feedback, status } = useApprovedFeedback();
  const hasApproved = status === 'success' && feedback.length > 0;

  return (
    <section id="feedback" className="scroll-mt-16 border-t border-border py-20">
      <Container>
        <SectionHeading
          eyebrow="Feedback"
          title="Client feedback"
          description="What people I've worked with have to say — and a place to leave your own."
        />

        {status === 'loading' && (
          <div className="mt-8 flex items-center gap-2 text-sm text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading feedback…
          </div>
        )}

        {/* Per spec: no fake/placeholder testimonials — this grid renders
            nothing at all (not even an empty state) when there are no
            approved records yet. The form below stays available either way. */}
        {hasApproved && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {feedback.map((item) => (
              <FeedbackCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <div className="mx-auto mt-10 max-w-lg">
          {!hasApproved && status === 'success' && (
            <p className="mb-4 flex items-center justify-center gap-2 text-center text-sm text-foreground-muted">
              <MessageSquareQuote className="h-4 w-4 text-accent" aria-hidden="true" />
              Be the first to leave feedback.
            </p>
          )}
          <FeedbackForm />
        </div>
      </Container>
    </section>
  );
}
