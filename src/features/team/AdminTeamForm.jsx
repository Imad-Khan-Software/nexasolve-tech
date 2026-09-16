import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Modal } from '../../components/modal/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { createTeamMember, updateTeamMember, uploadTeamPhoto } from '../../services/teamService.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const DESIGNATION_SUGGESTIONS = [
  'Founder',
  'CEO',
  'Executive Director',
  'Director',
  'Manager',
  'Coordinator',
  'Team Member',
];

const emptyForm = {
  name: '',
  designation: '',
  bio: '',
  phone: '',
  email: '',
  whatsapp: '',
  facebook_url: '',
  linkedin_url: '',
  instagram_url: '',
  website_url: '',
  display_order: 0,
  is_visible: false,
};

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!form.designation.trim()) errors.designation = 'Designation is required.';
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email, or leave it blank.';
  }
  return errors;
}

export function AdminTeamForm({ isOpen, onClose, member, onSaved }) {
  const isCreate = !member;
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      member
        ? {
            name: member.name || '',
            designation: member.designation || '',
            bio: member.bio || '',
            phone: member.phone || '',
            email: member.email || '',
            whatsapp: member.whatsapp || '',
            facebook_url: member.facebook_url || '',
            linkedin_url: member.linkedin_url || '',
            instagram_url: member.instagram_url || '',
            website_url: member.website_url || '',
            display_order: member.display_order ?? 0,
            is_visible: Boolean(member.is_visible),
          }
        : emptyForm
    );
    setPhotoFile(null);
    setPhotoRemoved(false);
    setPreviewUrl(member?.photo_url || null);
    setErrors({});
    setStatus('idle');
    setSubmitError(null);
  }, [isOpen, member]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, photo: 'Please choose a JPG, PNG, or WEBP image.' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((e) => ({ ...e, photo: 'Image is too large (max 5MB).' }));
      return;
    }

    setErrors((e) => ({ ...e, photo: undefined }));
    setPhotoFile(file);
    setPhotoRemoved(false);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoRemoved(true);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === 'submitting') return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    setSubmitError(null);
    try {
      let photo_url = member?.photo_url || null;
      if (photoFile) {
        photo_url = await uploadTeamPhoto(photoFile);
      } else if (photoRemoved) {
        photo_url = null;
      }

      const fields = { ...form, photo_url, display_order: Number(form.display_order) || 0 };
      const saved = isCreate ? await createTeamMember(fields) : await updateTeamMember(member.id, fields);

      onSaved(saved);
    } catch (err) {
      setSubmitError('Something went wrong saving this team member. Please try again.');
      setStatus('error');
      // eslint-disable-next-line no-console
      console.error('Team member save failed:', err);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isCreate ? 'Add Team Member' : 'Edit Team Member'} className="max-w-lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Profile picture</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-background-raised">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
                  <ImagePlus className="h-6 w-6" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="block w-full text-xs text-foreground-muted file:mr-3 file:rounded-DEFAULT file:border file:border-border file:bg-background-surface file:px-3 file:py-1.5 file:text-xs file:text-foreground hover:file:border-border-strong"
              />
              {previewUrl && (
                <button type="button" onClick={handleRemovePhoto} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground">
                  <X className="h-3 w-3" /> Remove picture
                </button>
              )}
              <p className="text-xs text-foreground-subtle">Optional, but recommended before making this person visible.</p>
              {errors.photo && <p className="text-xs text-danger">{errors.photo}</p>}
            </div>
          </div>
        </div>

        <FormField id="team-name" label="Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} />

        <div className="space-y-1.5">
          <label htmlFor="team-designation" className="text-sm font-medium text-foreground">Designation</label>
          <input
            id="team-designation"
            list="team-designation-suggestions"
            value={form.designation}
            onChange={(e) => updateField('designation', e.target.value)}
            placeholder="e.g. Founder, CEO, Team Member…"
            className="w-full rounded-DEFAULT border border-border bg-background-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
          />
          <datalist id="team-designation-suggestions">
            {DESIGNATION_SUGGESTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          {errors.designation && <p className="text-xs text-danger">{errors.designation}</p>}
        </div>

        <FormField id="team-bio" label="Short Bio (optional)" as="textarea" rows={3} value={form.bio} onChange={(e) => updateField('bio', e.target.value)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="team-phone" label="Phone (optional)" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
          <FormField id="team-email" label="Email (optional)" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} error={errors.email} />
          <FormField id="team-whatsapp" label="WhatsApp (optional)" value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} placeholder="e.g. 923001234567" />
          <FormField id="team-order" label="Display Order" type="number" value={form.display_order} onChange={(e) => updateField('display_order', e.target.value)} />
        </div>

        <FormField id="team-facebook" label="Facebook URL (optional)" value={form.facebook_url} onChange={(e) => updateField('facebook_url', e.target.value)} placeholder="https://" />
        <FormField id="team-linkedin" label="LinkedIn URL (optional)" value={form.linkedin_url} onChange={(e) => updateField('linkedin_url', e.target.value)} placeholder="https://" />
        <FormField id="team-instagram" label="Instagram URL (optional)" value={form.instagram_url} onChange={(e) => updateField('instagram_url', e.target.value)} placeholder="https://" />
        <FormField id="team-website" label="Website URL (optional)" value={form.website_url} onChange={(e) => updateField('website_url', e.target.value)} placeholder="https://" />

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.is_visible}
            onChange={(e) => updateField('is_visible', e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Visible on public website
        </label>

        {status === 'error' && submitError && (
          <p role="alert" className="text-sm text-danger">{submitError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" isLoading={status === 'submitting'} className="flex-1">
            {status === 'submitting' ? 'Saving…' : isCreate ? 'Add Team Member' : 'Save Changes'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={status === 'submitting'}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
