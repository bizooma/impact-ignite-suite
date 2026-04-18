import { useState, useMemo } from 'react';
import { useCrmGrants, GRANT_STAGES, type CrmGrant, type GrantStage } from '@/hooks/useCrmGrants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { GrantFormDialog } from './GrantFormDialog';
import {
  DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, useDroppable, useDraggable,
} from '@dnd-kit/core';

interface Props { organizationId: string; }

export function GrantPipelineKanban({ organizationId }: Props) {
  const { grants, isLoading, updateGrant, deleteGrant } = useCrmGrants(organizationId);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CrmGrant | null>(null);
  const [defaultStage, setDefaultStage] = useState<GrantStage | undefined>();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const map = new Map<GrantStage, CrmGrant[]>();
    GRANT_STAGES.forEach((s) => map.set(s.key, []));
    grants?.forEach((g) => map.get(g.stage)?.push(g));
    return map;
  }, [grants]);

  const totals = useMemo(() => {
    const requested = grants?.reduce((s, g) => s + Number(g.amount_requested || 0), 0) || 0;
    const awarded = grants?.filter((g) => g.stage === 'awarded' || g.stage === 'reporting' || g.stage === 'closed')
      .reduce((s, g) => s + Number(g.amount_awarded || 0), 0) || 0;
    return { requested, awarded };
  }, [grants]);

  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over) return;
    const grantId = String(e.active.id);
    const newStage = String(e.over.id) as GrantStage;
    const grant = grants?.find((g) => g.id === grantId);
    if (!grant || grant.stage === newStage) return;
    updateGrant.mutate({ id: grantId, updates: { stage: newStage } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total requested</p>
            <p className="text-xl font-bold">${totals.requested.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total awarded</p>
            <p className="text-xl font-bold text-emerald-600">${totals.awarded.toLocaleString()}</p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setDefaultStage(undefined); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Grant
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {GRANT_STAGES.map((s) => (
              <Column
                key={s.key}
                stage={s.key}
                label={s.label}
                grants={grouped.get(s.key) || []}
                onEdit={(g) => { setEditing(g); setShowForm(true); }}
                onDelete={(g) => { if (confirm(`Delete grant "${g.grant_name}"?`)) deleteGrant.mutate(g.id); }}
                onAdd={() => { setEditing(null); setDefaultStage(s.key); setShowForm(true); }}
              />
            ))}
          </div>
        </DndContext>
      )}

      <GrantFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        organizationId={organizationId}
        grant={editing}
        defaultStage={defaultStage}
      />
    </div>
  );
}

function Column({ stage, label, grants, onEdit, onDelete, onAdd }: {
  stage: GrantStage; label: string; grants: CrmGrant[];
  onEdit: (g: CrmGrant) => void; onDelete: (g: CrmGrant) => void; onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{label}</h3>
          <Badge variant="secondary">{grants.length}</Badge>
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onAdd}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] space-y-2 p-2 rounded-md bg-muted/30 transition-colors ${isOver ? 'bg-muted/70 ring-2 ring-primary/40' : ''}`}
      >
        {grants.map((g) => <GrantCard key={g.id} grant={g} onEdit={onEdit} onDelete={onDelete} />)}
        {grants.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Drop grants here</p>
        )}
      </div>
    </div>
  );
}

function GrantCard({ grant, onEdit, onDelete }: { grant: CrmGrant; onEdit: (g: CrmGrant) => void; onDelete: (g: CrmGrant) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: grant.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;
  const daysToDeadline = grant.deadline ? differenceInDays(new Date(grant.deadline), new Date()) : null;
  const overdue = daysToDeadline !== null && daysToDeadline < 0;
  const soon = daysToDeadline !== null && daysToDeadline >= 0 && daysToDeadline <= 14;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{grant.grant_name}</p>
            <p className="text-xs text-muted-foreground truncate">{grant.foundation_name}</p>
          </div>
          <div className="flex gap-0.5 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(grant)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete(grant)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {(grant.amount_requested || grant.amount_awarded) && (
          <div className="flex items-center gap-1 text-xs">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span>
              {grant.amount_awarded
                ? <>Awarded <strong>${Number(grant.amount_awarded).toLocaleString()}</strong></>
                : <>Requesting ${Number(grant.amount_requested).toLocaleString()}</>}
            </span>
          </div>
        )}
        {grant.deadline && (
          <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-destructive' : soon ? 'text-amber-600' : 'text-muted-foreground'}`}>
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(grant.deadline), 'MMM d, yyyy')}
              {daysToDeadline !== null && (
                <> · {overdue ? `${Math.abs(daysToDeadline)}d overdue` : `${daysToDeadline}d left`}</>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
