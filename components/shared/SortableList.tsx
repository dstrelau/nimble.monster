"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  label: string;
  children: (handle: ReactNode) => ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, label, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const handle = (
    <Button
      ref={setActivatorNodeRef}
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Reorder ${label}`}
      className="cursor-grab touch-none active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical />
    </Button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        "relative bg-background",
        isDragging && "z-10 rounded-md opacity-80 shadow-lg"
      )}
    >
      {children(handle)}
    </div>
  );
};

interface SortableListProps<T extends { id: string }> {
  items: T[];
  itemLabel: (item: T) => string;
  onReorder: (items: T[]) => void;
  children: (item: T, index: number, handle: ReactNode) => ReactNode;
}

export function SortableList<T extends { id: string }>({
  items,
  itemLabel,
  onReorder,
  children,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <SortableItem key={item.id} id={item.id} label={itemLabel(item)}>
            {(handle) => children(item, index, handle)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
