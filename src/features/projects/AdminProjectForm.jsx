import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Modal } from '../../components/modal/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { createProject, updateProject, uploadProjectImage } from '../../services/projectService.js';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB — no limit exists in the vanilla
// app to preserve, so this is a new, generous, frontend-only sanity check
// (explicitly asked for in this phase), not a backend requirement.

const emptyForm = { title: '', category: '', description: '', techs: '', demo_url: '', price: '' };

function validate(form, { isCreate, hasImage }) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Title is required.';
  if (!form.category.trim()) errors.category = 'Category is required.';
  if (!form.description.trim()) errors.description = 'Description is required.';
  if (!form.techs.trim()) errors.techs = 'List at least one technology.';

  if (!form.demo_url.trim()) {
    errors.demo_url = 'Demo URL is required.';
  } else {
    try {
      // eslint-disable-next-line no-new
      new URL(form.demo_url.trim());
    } catch {
      errors.demo_url = 'Enter a valid URL, including https://';
    }
  }

  // Matches the vanilla app exactly: a thumbnail is required to publish a
  // new project, but editing an existing project can keep its current
  // image without re-uploading.
  if (isCreate && !hasImage) {
    errors.image = 'Please select a thumbnail image.';
  }

  return errors;
}

/**
 * `project` is null for create mode, or an existing project row for edit
 * mode (form is pre-filled from it). `onSaved` is called with the
 * created/updated row after a successful submit — the parent page
 * decides whether to refetch the list or show a toast.
 */
export function AdminProjectForm({ isOpen, onClose, project, onSaved }) {
  const isCreate = !project;
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | error
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      project
        ? {
            title: project.title || '',
            category: project.category || '',
            description: project.description || '',
            techs: project.techs || '',
            demo_url: project.demo_url || '',
            price: project.price || '',
          }
        : emptyForm
    );
    setImageFile(null);
    setPreviewUrl(project?.image_url || null);
    setErrors({});
    setStatus('idle');
    setSubmitError(null);
  }, [isOpen, project]);

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

    if (!file.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, image: 'Please choose an image file.' }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((e) => ({ ...e, image: 'Image is too large (max 8MB).' }));
      return;
    }

    setErrors((e) => ({ ...e, image: undefined }));
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveNewImage() {
    setImageFile(null);
    setPreviewUrl(project?.image_url || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === 'submitting') return;

    const hasImage = Boolean(imageFile || project?.image_url);
    const nextErrors = validate(form, { isCreate, hasImage });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    setSubmitError(null);
    try {
      let image_url = project?.image_url || null;
      if (imageFile) {
        image_url = await uploadProjectImage(imageFile);
      }

      const fields = { ...form, image_url };
      const saved = isCreate ? await createProject(fields) : await updateProject(project.id, fields);

      onSaved(saved);
    } catch (err) {
      setSubmitError('Something went wrong saving this project. Please try again.');
      setStatus('error');
      // eslint-disable-next-line no-console
      console.error('Project save failed:', err);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isCreate ? 'Add Project' : 'Edit Project'} className="max-w-lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Project image</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="aspect-video w-full shrink-0 overflow-hidden rounded-DEFAULT border border-border bg-background-raised sm:w-40">
              {previewUrl ? (
                <img src={previewUrl} alt="Project thumbnail preview" className="h-full w-full object-contain" />
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
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-xs text-foreground-muted file:mr-3 file:rounded-DEFAULT file:border file:border-border file:bg-background-surface file:px-3 file:py-1.5 file:text-xs file:text-foreground hover:file:border-border-strong"
              />
              {imageFile && (
                <button
                  type="button"
                  onClick={handleRemoveNewImage}
                  className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Keep existing image instead
                </button>
              )}
              {!isCreate && !imageFile && (
                <p className="text-xs text-foreground-subtle">Leave blank to keep the current image.</p>
              )}
              {errors.image && <p className="text-xs text-danger">{errors.image}</p>}
            </div>
          </div>
        </div>

        <FormField id="project-title" label="Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} error={errors.title} />
        <FormField id="project-category" label="Category" value={form.category} onChange={(e) => updateField('category', e.target.value)} error={errors.category} />
        <FormField id="project-description" label="Description" as="textarea" rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} error={errors.description} />
        <FormField id="project-techs" label="Technologies (comma-separated)" value={form.techs} onChange={(e) => updateField('techs', e.target.value)} error={errors.techs} placeholder="React, Tailwind, Supabase" />
        <FormField id="project-demo-url" label="Demo URL" value={form.demo_url} onChange={(e) => updateField('demo_url', e.target.value)} error={errors.demo_url} placeholder="https://" />
        <FormField id="project-price" label="Price (optional)" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder='e.g. "$150" or leave blank' />

        {status === 'error' && submitError && (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" isLoading={status === 'submitting'} className="flex-1">
            {status === 'submitting' ? 'Saving…' : isCreate ? 'Add Project' : 'Save Changes'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={status === 'submitting'}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
