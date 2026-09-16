import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from '../../components/modal/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { updateFeedback } from '../../services/feedbackService.js';

const emptyForm = { name: '', email: '', rating: 5, message: '', status: 'pending' };

export function AdminFeedbackEditForm({ isOpen, onClose, item, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      item
        ? { name: item.name || '', email: item.email || '', rating: item.rating || 5, message: item.message || '', status: item.status || 'pending' }
        : emptyForm
    );
    setErrors({});
    setStatus('idle');
    setSubmitError(null);
  }, [isOpen, item]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.message.trim()) next.message = 'Message is required.';
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!item || status === 'submitting') return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    setSubmitError(null);
    try {
      const saved = await updateFeedback(item.id, form);
      onSaved(saved);
    } catch (err) {
      setSubmitError('Something went wrong saving this feedback. Please try again.');
      setStatus('error');
      // eslint-disable-next-line no-console
      console.error('Feedback update failed:', err);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Feedback" className="max-w-lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField id="fb-edit-name" label="Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} />
        <FormField id="fb-edit-email" label="Email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
        <FormField id="fb-edit-message" label="Message" as="textarea" rows={3} value={form.message} onChange={(e) => updateField('message', e.target.value)} error={errors.message} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Rating</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => updateField('rating', n)} className="p-0.5">
                <Star className={n <= form.rating ? 'h-5 w-5 fill-accent text-accent' : 'h-5 w-5 text-border-strong'} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="fb-edit-status" className="text-sm font-medium text-foreground">Status</label>
          <select
            id="fb-edit-status"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full rounded-DEFAULT border border-border bg-background-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {status === 'error' && submitError && (
          <p role="alert" className="text-sm text-danger">{submitError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" isLoading={status === 'submitting'} className="flex-1">
            {status === 'submitting' ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={status === 'submitting'}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
