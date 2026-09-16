import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import { useProfile } from '../../hooks/useProfile.js';

const MAX_AVATAR_BYTES = 8 * 1024 * 1024; // 8MB — same generous, frontend-only
// sanity check used for project images in Phase 5; vanilla has no limit at all.

// The exact set of keys already read from `socials` elsewhere in this app
// (siteConfig.js resolveContactLinks, Footer, Hero) — not invented here.
const SOCIAL_FIELDS = [
  { key: 'whatsapp', label: 'WhatsApp (full link)' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyForm() {
  return { name: '', location: '', email: '', tagline: '', socials: {} };
}

function formFromProfile(profile) {
  return {
    name: profile.name || '',
    location: profile.location || '',
    email: profile.email || '',
    tagline: profile.tagline || '',
    socials: { ...(profile.socials || {}) },
  };
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  for (const { key, label } of SOCIAL_FIELDS) {
    const raw = form.socials[key];
    const value = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
    if (!value) continue;
    try {
      // eslint-disable-next-line no-new
      new URL(value);
    } catch {
      errors[`socials.${key}`] = `Enter a valid URL for ${label}, including https://`;
    }
  }
  return errors;
}

export function AdminProfile() {
  const { profile, status, error, refetch, saveProfile, changeAvatar } = useProfile();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | error
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toast, setToast] = useState(null);

  // Seed the form once the profile loads (and again after a successful
  // save, so the form reflects exactly what's now stored).
  useEffect(() => {
    if (profile) setForm(formFromProfile(profile));
  }, [profile]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function updateSocial(key, value) {
    setForm((f) => ({ ...f, socials: { ...f.socials, [key]: value } }));
    const errorKey = `socials.${key}`;
    if (errors[errorKey]) setErrors((e) => ({ ...e, [errorKey]: undefined }));
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Please choose an image file.' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setToast({ type: 'error', message: 'Image is too large (max 8MB).' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await changeAvatar(file);
      setToast({ type: 'success', message: 'Profile picture updated!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Upload failed. Please try again.' });
      // eslint-disable-next-line no-console
      console.error('Avatar upload failed:', err);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saveStatus === 'saving') return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Only send socials keys that have a value, so we don't overwrite
    // existing keys the form doesn't happen to render with empty strings.
    const cleanedSocials = Object.fromEntries(
      Object.entries(form.socials)
        .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : String(v ?? '').trim()])
        .filter(([, v]) => v)
    );

    setSaveStatus('saving');
    try {
      await saveProfile({
        name: form.name.trim(),
        location: form.location.trim() || null,
        email: form.email.trim() || null,
        tagline: form.tagline.trim() || null,
        socials: cleanedSocials,
      });
      setSaveStatus('idle');
      setToast({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setSaveStatus('error');
      setToast({ type: 'error', message: 'Could not save changes. Please try again.' });
      // eslint-disable-next-line no-console
      console.error('Profile save failed:', err);
    }
  }

  if (status === 'loading') return <Loading label="Loading profile…" />;

  if (status === 'error' || !profile) {
    return (
      <ErrorState
        title="Couldn't load profile"
        message={error?.message || 'No profile row was found.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          This information is shown on your public portfolio.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-background-raised">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Your avatar" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
              <Camera className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
          {isUploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-foreground">
              Uploading…
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-upload-input"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
          >
            <Camera className="h-4 w-4" /> {isUploadingAvatar ? 'Uploading…' : 'Change Avatar'}
          </Button>
          <p className="mt-1.5 text-xs text-foreground-subtle">JPG or PNG, up to 8MB.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="space-y-4">
          <FormField id="profile-name" label="Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} />
          <FormField id="profile-location" label="Location" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
          <FormField id="profile-email" label="Email (optional)" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} error={errors.email} />
          <FormField
            id="profile-tagline"
            label="Tagline"
            value={form.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            placeholder="Frontend Developer | React Developer"
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Social links</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map(({ key, label }) => (
              <FormField
                key={key}
                id={`profile-social-${key}`}
                label={label}
                value={form.socials[key] || ''}
                onChange={(e) => updateSocial(key, e.target.value)}
                error={errors[`socials.${key}`]}
                placeholder="https://"
              />
            ))}
          </div>
        </div>

        <Button type="submit" isLoading={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
        </Button>
      </form>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
