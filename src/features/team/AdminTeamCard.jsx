import { Pencil, Trash2, User, Eye, EyeOff } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function AdminTeamCard({ member, onEdit, onDelete, onToggleVisibility }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-background-surface p-4 sm:flex-row sm:items-center">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-background-raised">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground-subtle">
            <User className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{member.name}</h3>
          <Badge variant="accent">{member.designation}</Badge>
          <Badge variant={member.is_visible ? 'accent' : 'neutral'}>
            {member.is_visible ? 'Visible' : 'Hidden'}
          </Badge>
        </div>
        {member.bio && <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">{member.bio}</p>}
        <p className="mt-1 text-xs text-foreground-subtle">
          Order {member.display_order} · Updated {new Date(member.updated_at || member.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => onToggleVisibility(member)}>
          {member.is_visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {member.is_visible ? 'Hide' : 'Show'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(member)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={() => onDelete(member)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}
