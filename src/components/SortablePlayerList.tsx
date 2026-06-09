import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Player } from '../types';
import { EmojiPicker } from './EmojiPicker';

interface RowProps {
  player: Player;
  takenEmojis: string[];
  onChange: (patch: Partial<Player>) => void;
  onRemove: () => void;
  dragDisabled: boolean;
}

function SortablePlayerRow({
  player,
  takenEmojis,
  onChange,
  onRemove,
  dragDisabled,
}: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id, disabled: dragDisabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: player.color + '88',
    background: player.color + '11',
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging ? `0 10px 24px ${player.color}55` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 sm:gap-3 rounded-2xl p-3 border-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Przenieś gracza ${player.name}. Użyj strzałek góra/dół, aby zmienić kolejność.`}
        disabled={dragDisabled}
        className="flex items-center justify-center w-8 h-12 text-slate-500 hover:text-slate-900 cursor-grab active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-md"
        title={dragDisabled ? 'Dodaj kolejnego gracza, by zmieniać kolejność' : 'Przeciągnij, by zmienić kolejność'}
      >
        <span aria-hidden className="text-xl leading-none">⠿</span>
      </button>
      <EmojiPicker
        value={player.emoji}
        onChange={(emoji) => onChange({ emoji })}
        taken={takenEmojis}
        color={player.color}
        label={`Zmień ikonkę gracza ${player.name}`}
      />
      <input
        className="input flex-1 min-w-0"
        value={player.name}
        maxLength={24}
        onChange={(e) => onChange({ name: e.target.value })}
        aria-label={`Imię gracza ${player.name}`}
      />
      <select
        className="input w-24 sm:w-28"
        value={player.age === 'dorosly' ? 'dorosly' : String(player.age)}
        onChange={(e) =>
          onChange({
            age:
              e.target.value === 'dorosly' ? 'dorosly' : Number(e.target.value),
          })
        }
        aria-label={`Wiek gracza ${player.name}`}
      >
        {Array.from({ length: 12 }, (_, i) => i + 5).map((a) => (
          <option key={a} value={a}>
            {a} lat
          </option>
        ))}
        <option value="dorosly">Dorosły</option>
      </select>
      <button
        className="btn-soft px-3 min-w-[48px]"
        onClick={onRemove}
        aria-label={`Usuń gracza ${player.name}`}
      >
        <span aria-hidden>✕</span>
      </button>
    </div>
  );
}

interface ListProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
}

export function SortablePlayerList({ players, setPlayers }: ListProps) {
  const sensors = useSensors(
    // Mysz / pen: drag startuje po przesunięciu 5 px (nie blokuje klików w
    // input/select/EmojiPicker na płytkim kliku).
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Dotyk: hold 220 ms zanim drag wystartuje — żeby zwykły tap w pole
    // imienia / wieku nie złapał gracza w drag.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = players.findIndex((p) => p.id === active.id);
    const newIndex = players.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setPlayers(arrayMove(players, oldIndex, newIndex));
  };

  const dragDisabled = players.length < 2;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={players.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        {players.map((p) => {
          const takenEmojis = players
            .filter((x) => x.id !== p.id)
            .map((x) => x.emoji);
          return (
            <SortablePlayerRow
              key={p.id}
              player={p}
              takenEmojis={takenEmojis}
              onChange={(patch) =>
                setPlayers(
                  players.map((x) => (x.id === p.id ? { ...x, ...patch } : x)),
                )
              }
              onRemove={() =>
                setPlayers(players.filter((x) => x.id !== p.id))
              }
              dragDisabled={dragDisabled}
            />
          );
        })}
      </SortableContext>
    </DndContext>
  );
}
