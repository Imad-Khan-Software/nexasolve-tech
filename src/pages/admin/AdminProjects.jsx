import { useMemo, useState } from 'react';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { cn } from '../../lib/cn.js';
import { useProjects } from '../../hooks/useProjects.js';
import { deleteProject as deleteProjectRequest } from '../../services/projectService.js';
import { AdminProjectCard } from '../../features/projects/AdminProjectCard.jsx';
import { AdminProjectForm } from '../../features/projects/AdminProjectForm.jsx';

export function AdminProjects() {
  const { projects, status, error, refetch } = useProjects();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [formState, setFormState] = useState({ open: false, project: null });
  const [deleteState, setDeleteState] = useState({ open: false, project: null, isDeleting: false });
  const [toast, setToast] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory = !selectedCategory || project.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      const haystack = [project.title, project.description, project.category, project.techs]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [projects, searchTerm, selectedCategory]);

  function openCreateForm() {
    setFormState({ open: true, project: null });
  }

  function openEditForm(project) {
    setFormState({ open: true, project });
  }

  function closeForm() {
    setFormState({ open: false, project: null });
  }

  function handleSaved() {
    const wasCreate = !formState.project;
    closeForm();
    refetch();
    setToast({
      type: 'success',
      message: wasCreate ? 'Project created successfully.' : 'Project updated successfully.',
    });
  }

  function openDeleteConfirm(project) {
    setDeleteState({ open: true, project, isDeleting: false });
  }

  function closeDeleteConfirm() {
    if (deleteState.isDeleting) return;
    setDeleteState({ open: false, project: null, isDeleting: false });
  }

  async function handleConfirmDelete() {
    if (!deleteState.project) return;
    setDeleteState((s) => ({ ...s, isDeleting: true }));
    try {
      await deleteProjectRequest(deleteState.project.id);
      setDeleteState({ open: false, project: null, isDeleting: false });
      refetch();
      setToast({ type: 'success', message: 'Project deleted successfully.' });
    } catch (err) {
      setDeleteState((s) => ({ ...s, isDeleting: false }));
      setToast({ type: 'error', message: 'Could not delete this project. Please try again.' });
      // eslint-disable-next-line no-console
      console.error('Project delete failed:', err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Projects here are the same ones shown on your public portfolio.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="h-4 w-4" /> Add Project
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" aria-hidden="true" />
          <label htmlFor="admin-project-search" className="sr-only">Search projects</label>
          <input
            id="admin-project-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-DEFAULT border border-border bg-background-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {['All', ...categories].map((category) => {
              const isActive = category === 'All' ? selectedCategory === null : selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category === 'All' ? null : category)}
                  aria-pressed={isActive}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive ? 'border-transparent bg-accent text-background' : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {status === 'loading' && <Loading label="Loading projects…" />}

      {status === 'error' && (
        <ErrorState
          title="Couldn't load projects"
          message={error?.message || 'Something went wrong while fetching projects.'}
          onRetry={refetch}
        />
      )}

      {status === 'success' && projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Add your first project to have it appear on your public portfolio."
          action={
            <Button type="button" size="sm" onClick={openCreateForm}>
              <Plus className="h-4 w-4" /> Add Project
            </Button>
          }
        />
      )}

      {status === 'success' && projects.length > 0 && filteredProjects.length === 0 && (
        <EmptyState icon={FolderKanban} title="No projects found" description="Try a different search term or category." />
      )}

      {status === 'success' && filteredProjects.length > 0 && (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <AdminProjectCard
              key={project.id}
              project={project}
              onEdit={openEditForm}
              onDelete={openDeleteConfirm}
            />
          ))}
        </div>
      )}

      <AdminProjectForm
        isOpen={formState.open}
        project={formState.project}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        isOpen={deleteState.open}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isLoading={deleteState.isDeleting}
        title="Delete Project?"
        message={
          deleteState.project
            ? `Are you sure you want to delete "${deleteState.project.title}"? This action cannot be undone.`
            : ''
        }
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
