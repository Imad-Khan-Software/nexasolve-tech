import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { Modal } from '../../components/modal/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { createOrder } from '../../services/orderService.js';
import { saveTrackingToken } from '../../lib/trackingTokens.js';
import { recordVisitorName } from '../../services/visitorService.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ name, email, message }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Please enter your name.';
  if (!email.trim()) {
    errors.email = 'Please enter your email.';
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!message.trim()) errors.message = 'Please add a short message.';
  return errors;
}

const initialForm = { name: '', email: '', message: '' };

/**
 * One shared modal instance (owned by ProjectsSection), reused for every
 * project's "Enquire" click. `project` is the project the enquiry is
 * about (or null for a general enquiry). Insert shape matches the
 * existing vanilla order-form handler exactly: { client_name,
 * client_email, project_title, message } — no project_id (the schema
 * doesn't have one), no phone/status fields (the vanilla app doesn't
 * collect or use them either).
 */
export function EnquiryModal({ isOpen, onClose, project }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [submitError, setSubmitError] = useState(null);
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  const projectTitle = project?.title || 'General Inquiry';

  // Reset all local state whenever the modal is opened fresh (new
  // project or reopened after a previous close) rather than leaking the
  // last submission's success screen into the next enquiry.
  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setErrors({});
      setStatus('idle');
      setSubmitError(null);
      setOrder(null);
      setCopied(false);
    }
  }, [isOpen, project]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === 'submitting') return; // guards accidental double submit

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    setSubmitError(null);
    try {
      const inserted = await createOrder({
        client_name: form.name.trim(),
        client_email: form.email.trim(),
        project_title: projectTitle,
        message: form.message.trim(),
      });
      if (inserted?.access_token) {
        saveTrackingToken(inserted.access_token, projectTitle);
      }
      recordVisitorName(form.name.trim());
      setOrder(inserted);
      setStatus('success');
    } catch (err) {
      // Don't surface raw Supabase/SQL error text to the customer.
      setSubmitError('Something went wrong sending your enquiry. Please try again.');
      setStatus('error');
      // eslint-disable-next-line no-console
      console.error('Order submission failed:', err);
    }
  }

  function handleCopyToken() {
    if (!order?.access_token) return;
    navigator.clipboard?.writeText(order.access_token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (status === 'success' && order) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Enquiry sent">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
          <p className="text-sm text-foreground-muted">
            Your enquiry has been submitted successfully. Save this tracking ID to check
            your enquiry status later.
          </p>

          {order.access_token && (
            <div className="w-full">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Tracking ID
              </p>
              <div className="flex items-center gap-2 rounded-DEFAULT border border-border bg-background-surface px-3 py-2">
                <code className="flex-1 truncate font-mono text-sm text-foreground">
                  {order.access_token}
                </code>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  aria-label="Copy tracking ID"
                  className="shrink-0 rounded-sm p-1 text-foreground-muted hover:text-foreground"
                >
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
            <Button
              as="a"
              href={order.access_token ? `/track?track=${encodeURIComponent(order.access_token)}` : '/track'}
              className="flex-1"
            >
              Track this Enquiry
            </Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Enquire: ${projectTitle}`}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          id="enquiry-name"
          label="Your name"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          autoComplete="name"
        />
        <FormField
          id="enquiry-email"
          label="Your email"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <FormField
          id="enquiry-message"
          label="Message / requirements"
          as="textarea"
          rows={4}
          value={form.message}
          onChange={(e) => updateField('message', e.target.value)}
          error={errors.message}
        />

        {status === 'error' && submitError && (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" isLoading={status === 'submitting'} className="flex-1">
            {status === 'submitting' ? 'Sending…' : 'Send Enquiry'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={status === 'submitting'}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
