import React from "react";
import type { Monster } from "../lib/types";
import { Link } from "react-router-dom";
import PencilIcon from "@heroicons/react/24/outline/PencilIcon";

const MonsterList: React.FC<{ monsters: Monster[] }> = ({ monsters }) => {
  return (
    <div className="divide-y divide-gray-200">
      {monsters.map((monster) => (
        <div
          key={monster.id}
          className="py-3 flex items-center justify-between"
        >
          <div className="flex items-center">
            <div className="ml-3">
              <h3 className="text-lg font-medium">{monster.name}</h3>
              <p className="text-sm text-gray-500">
                Level {monster.level} {monster.size} {monster.kind} • HP{" "}
                {monster.hp}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/monsters/${monster.id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              View
            </Link>
            <Link
              to={`/my/monsters/${monster.id}/edit`}
              className="text-gray-600 hover:text-gray-800"
            >
              <PencilIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};
export default MonsterList;
