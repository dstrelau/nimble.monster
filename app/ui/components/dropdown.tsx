"use client";

import { ReactNode, useEffect, useRef } from "react";

export type DropdownPosition = "top" | "bottom" | "left" | "right" | "end";
export type DropdownAlignment = "start" | "end" | "middle";

export interface DropdownItem {
  // label: ReactNode;
  // icon?: ReactNode;
  element: ReactNode;
  onClick?: () => void;
  endIcon?: ReactNode;
  className?: string;
}

interface DropdownProps {
  summary: ReactNode;
  items: DropdownItem[];
  position?: DropdownPosition;
  alignment?: DropdownAlignment;
  className?: string;
  menuClassName?: string;
}

export const Dropdown = ({
  summary,
  items,
  position = "bottom",
  alignment = "start",
  className = "",
  menuClassName = "",
}: DropdownProps) => {
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        dropdownRef.current.open
      ) {
        dropdownRef.current.open = false;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleItemClick = async (onClick?: () => void) => {
    if (dropdownRef.current) {
      dropdownRef.current.open = false;
    }
    if (onClick) onClick();
  };

  return (
    <details
      ref={dropdownRef}
      className={`d-dropdown d-dropdown-${position} d-dropdown-${alignment} ${className}`}
    >
      <summary className="list-none cursor-pointer">{summary}</summary>
      <div
        className={`d-dropdown-content z-10 bg-base-100 shadow-sm ${menuClassName}`}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={`p-2 flex items-center gap-2 w-full cursor-pointer hover:bg-base-200 ${
              item.className || ""
            }`}
            onClick={() => handleItemClick(item.onClick)}
          >
            {item.element}
          </div>
        ))}
      </div>
    </details>
  );
};
