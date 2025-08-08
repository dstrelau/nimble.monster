"use client";

import { Check, Pencil, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface InlineEditInputProps {
  value: string;
  onConfirmAction: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  showEditIcon?: boolean;
  canEdit?: boolean;
  displayComponent: React.ReactNode;
  editComponent: React.ReactElement;
}

export function InlineEditInput({
  value,
  onConfirmAction,
  onCancel,
  placeholder,
  showEditIcon = true,
  canEdit = true,
  displayComponent,
  editComponent,
}: InlineEditInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  }, [value, onCancel]);

  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, handleCancel]);

  const handleConfirm = () => {
    onConfirmAction(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    const inputElement = React.cloneElement(editComponent, {
      ref: inputRef,
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setEditValue(e.target.value),
      onKeyDown: handleKeyDown,
      placeholder,
      ...editComponent.props,
    });

    return (
      <div ref={containerRef} className="flex items-center gap-2">
        {inputElement}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleConfirm}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!canEdit) {
    return displayComponent;
  }

  return (
    <button
      type="button"
      className="group relative inline-flex items-center gap-2 transition-colors hover:bg-muted cursor-pointer rounded-md px-3 py-1"
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      tabIndex={0}
    >
      {displayComponent}
      {showEditIcon && (
        <Pencil className="h-4 w-4 text-muted-foreground/50 group-hover:text-orange-500 group-hover:opacity-100 transition-all ml-2" />
      )}
    </button>
  );
}
