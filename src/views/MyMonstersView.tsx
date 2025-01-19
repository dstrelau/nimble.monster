import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchApi } from "../lib/api";
import { Monster } from "../lib/types";
import MonsterCard from "../components/MonsterCard";

export type MonsterDisplay = "card" | "table";

// interface ButtonGroupItemProps {
//   id: string;
//   url: string;
//   icon: React.ReactNode;
//   label: string;
//   isSelected: boolean;
//   onClick: () => void;
// }
// const ButtonGroupItem: React.FC<ButtonGroupItemProps> = ({
//   icon,
//   label,
//   isSelected,
//   onClick,
// }) => {
//   return (
//     <button
//       onClick={onClick}
//       className={`
//         inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-200 focus:z-10 focus:ring-2 focus:ring-blue-700
//         ${isSelected ? "bg-white" : "bg-gray-200"}
//       `}
//     >
//       {icon}
//       <span className="ml-1">{label}</span>
//     </button>
//   );
// };

// const ButtonGroup: React.FC<{
//   selected: MonsterDisplay;
//   onDisplayChange: (display: MonsterDisplay) => void;
// }> = ({ selected, onDisplayChange }) => {
//   const items = [
//     {
//       id: "card",
//       url: "?display=card",
//       icon: <Squares2X2Icon className="w-4 h-4 text-slate-800" />,
//       label: "Cards",
//     },
//     {
//       id: "table",
//       url: "?display=table",
//       icon: <TableCellsIcon className="w-4 h-4 text-slate-800" />,
//       label: "Table",
//     },
//   ];

//   return (
//     <div className="flex rounded-md shadow-sm" role="group">
//       {items.map((item) => (
//         <ButtonGroupItem
//           key={item.id}
//           {...item}
//           isSelected={selected === item.id}
//           onClick={() => onDisplayChange(item.id as MonsterDisplay)}
//         />
//       ))}
//     </div>
//   );
// };

const MonsterTable: React.FC<{ monsters: Monster[] }> = ({ monsters }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          {/* Add other table headers */}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {monsters.map((monster) => (
          <tr key={monster.id}>
            <td className="px-6 py-4 whitespace-nowrap">{monster.name}</td>
            {/* Add other monster details */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const MyMonstersView = () => {
  const [display] = useState<MonsterDisplay>("card");

  const { data, isLoading, error } = useQuery({
    queryKey: ["monsters"],
    queryFn: () => fetchApi<{ monsters: Monster[] }>("/api/users/me/monsters"),
    staleTime: 0,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading monsters: {error.message}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      {/* <div className="grid justify-items-center mb-4">
        <ButtonGroup selected={display} onDisplayChange={setDisplay} />
      </div> */}
      {display === "table" ? (
        <MonsterTable monsters={data.monsters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.monsters.map((monster) => (
            <MonsterCard
              key={monster.id}
              monster={monster}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMonstersView;
