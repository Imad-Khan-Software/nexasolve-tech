import { useMemo, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { Toast } from '../../components/ui/Toast.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { cn } from '../../lib/cn.js';
import { useAdminTeamMembers } from '../../hooks/useAdminTeamMembers.js';
import { updateTeamMember, deleteTeamMember as deleteTeamMemberRequest } from '../../services/teamService.js';
import { AdminTeamCard } from '../../features/team/AdminTeamCard.jsx';
import { AdminTeamForm } from '../../features/team/AdminTeamForm.jsx';

export function AdminTeam() {
  const { members, status, error, refetch } = useAdminTeamMembers();

  const [searchTerm, setSearchTerm] = useState('');
  const [designationFilter, setDesignationFilter] = useState(null);

  const [formState, setFormState] = useState({ open: false, member: null });
  const [deleteState, setDeleteState] = useState({ open: false, member: null, isDeleting: false });
  const [toast, setToast] = useState(null);

  const designations = useMemo(() => {
    const set = new Set(members.map((m) => m.designation).filter(Boolean));
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return members.filter((member) => {
      const matchesDesignation = !designationFilter || member.designation === designationFilter;
      if (!matchesDesignation) return false;
      if (!query) return true;
      const haystack = [member.name, member.designation, member.bio].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [members, searchTerm, designationFilter]);

  function openCreateForm() {
    setFormState({ open: true, member: null });
  }
  function openEditForm(member) {
    setFormState({ open: true, member });
  }
  function closeForm() {
    setFormState({ open: false, member: null });
  }
  function handleSaved() {
    const wasCreate = !formState.member;
    closeForm();
    refetch();
    setToast({ type: 'success', message: wasCreate ? 'Team member added successfully.' : 'Team member updated successfully.' });
  }

  async function handleToggleVisibility(member) {
    try {
      await updateTeamMember(member.id, { is_visible: !member.is_visible });
      refetch();
      setToast({ type: 'success', message: member.is_visible ? 'Hidden from public site.' : 'Now visible on public site.' });
    } catch (err) {
      setToast({ type: 'error', message: 'Could not update visibility. Please try again.' });
      // eslint-disable-next-line no-console
      console.error('Team visibility toggle failed:', err);
    }
  }

  function openDeleteConfirm(member) {
    setDeleteState({ open: true, member, isDeleting: false });
  }
  function closeDeleteConfirm() {
    if (deleteState.isDeleting) return;
    setDeleteState({ open: false, member: null, isDeleting: false });
  }
  async function handleConfirmDelete() {
    if (!deleteState.member) return;
    setDeleteState((s) => ({ ...s, isDeleting: true }));
    try {
      await deleteTeamMemberRequest(deleteState.member.id);
      setDeleteState({ open: false, member: null, isDeleting: false });
      refetch();
      setToast({ type: 'success', message: 'Team member deleted successfully.' });
    } catch (err) {
      setDeleteState((s) => ({ ...s, isDeleting: false }));
      setToast({ type: 'error', message: 'Could not delete this team member. Please try again.' });
      // eslint-disable-next-line no-console
      console.error('Team member delete failed:', err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Team / Executives</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Manage who appears in the "Our Leadership" section of your public site.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="h-4 w-4" /> Add Team Member
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" aria-hidden="true" />
          <label htmlFor="admin-team-search" className="sr-only">Search team members</label>
          <input
            id="admin-team-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, designation…"
            className="w-full rounded-DEFAULT border border-border bg-background-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none"
          />
        </div>

        {designations.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by designation">
            {['All', ...designations].map((d) => {
              const isActive = d === 'All' ? designationFilter === null : designationFilter === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDesignationFilter(d === 'All' ? null : d)}
                  aria-pressed={isActive}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    isActive ? 'border-transparent bg-accent text-background' : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {status === 'loading' && <Loading label="Loading team members…" />}

      {status === 'error' && (
        <ErrorState title="Couldn't load team members" message={error?.message || 'Something went wrong.'} onRetry={refetch} />
      )}

      {status === 'success' && members.length === 0 && (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Add your first team member to have them appear on your public site."
          action={
            <Button type="button" size="sm" onClick={openCreateForm}>
              <Plus className="h-4 w-4" /> Add Team Member
            </Button>
          }
        />
      )}

      {status === 'success' && members.length > 0 && filtered.length === 0 && (
        <EmptyState icon={Users} title="No team members found" description="Try a different search term or designation." />
      )}

      {status === 'success' && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((member) => (
            <AdminTeamCard
              key={member.id}
              member={member}
              onEdit={openEditForm}
              onDelete={openDeleteConfirm}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}

      <AdminTeamForm isOpen={formState.open} member={formState.member} onClose={closeForm} onSaved={handleSaved} />

      <ConfirmDialog
        isOpen={deleteState.open}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isLoading={deleteState.isDeleting}
        title="Delete Team Member?"
        message={deleteState.member ? `Are you sure you want to delete "${deleteState.member.name}"? This action cannot be undone.` : ''}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
