import { memo, useCallback, useMemo } from 'react';
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
  takenEmojis: readonly string[];
  onChange: (id: string, patch: Partial<Player>) => void;
  onRemove: (id: string) => void;
  dragDisabled: boolean;
}

function SortablePlayerRowImpl({
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

  // Stabilne handlery związane z tym jednym graczem — niezależne od listy
  // (parent pasuje stabilne onChange/onRemove + id wiąże się tu).
  const handleEmoji = useCallback(
    (emoji: string) => onChange(player.id, { emoji }),
    [onChange, player.id],
  );
  const handleName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(player.id, { name: e.target.value }),
    [onChange, player.id],
  );
  const handleAge = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      onChange(player.id, {
        age:
          e.target.value === 'dorosly' ? 'dorosly' : Number(e.target.value),
      }),
    [onChange, player.id],
  );
  const handleRemove = useCallback(
    () => onRemove(player.id),
    [onRemove, player.id],
  );

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
        onChange={handleEmoji}
        taken={takenEmojis as string[]}
        color={player.color}
        label={`Zmień ikonkę gracza ${player.name}`}
      />
      <input
        className="input flex-1 min-w-0"
        value={player.name}
        maxLength={24}
        onChange={handleName}
        aria-label={`Imię gracza ${player.name}`}
      />
      <select
        className="input w-24 sm:w-28"
        value={player.age === 'dorosly' ? 'dorosly' : String(player.age)}
        onChange={handleAge}
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
        onClick={handleRemove}
        aria-label={`Usuń gracza ${player.name}`}
      >
        <span aria-hidden>✕</span>
      </button>
    </div>
  );
}

// React.memo z domyślnym shallow-compare — ze stabilnymi callbackami z parenta
// i `takenEmojis` z useMemo, re-render rzędu zachodzi tylko gdy zmienia się
// dany gracz, jego dragDisabled lub jego lista zajętych emoji.
const SortablePlayerRow = memo(SortablePlayerRowImpl);

interface ListProps {
  players: Player[];
  setPlayers: (
    players: Player[] | ((prev: Player[]) => Player[]),
  ) => void;
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

  // Stabilne handlery na poziomie listy — używają funkcyjnego setState, więc
  // nie muszą trzymać `players` w deps. Dzięki temu się nie rekreują na
  // każdym renderze parent'a — React.memo na wierszach pomija re-render
  // wierszy, których dane się nie zmieniły.
  const handleChange = useCallback(
    (id: string, patch: Partial<Player>) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
    },
    [setPlayers],
  );
  const handleRemove = useCallback(
    (id: string) => {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    },
    [setPlayers],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setPlayers((prev) => {
        const oldIndex = prev.findIndex((p) => p.id === active.id);
        const newIndex = prev.findIndex((p) => p.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    },
    [setPlayers],
  );

  // Per-player lista zajętych emoji — useMemo na cały słownik raz, zamiast
  // filter() przy każdym wierszu.
  const takenByPlayerId = useMemo(() => {
    const all = players.map((p) => p.emoji);
    const map: Record<string, readonly string[]> = {};
    players.forEach((p, idx) => {
      map[p.id] = [...all.slice(0, idx), ...all.slice(idx + 1)];
    });
    return map;
  }, [players]);

  const dragDisabled = players.length < 2;
  const itemIds = useMemo(() => players.map((p) => p.id), [players]);
  const FALLBACK_TAKEN: readonly string[] = [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {players.map((p) => (
          <SortablePlayerRow
            key={p.id}
            player={p}
            takenEmojis={takenByPlayerId[p.id] ?? FALLBACK_TAKEN}
            onChange={handleChange}
            onRemove={handleRemove}
            dragDisabled={dragDisabled}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
