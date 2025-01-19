import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { fetchApi } from "../lib/api";
import { Monster } from "../lib/types";
import BuildMonster from "./BuildMonsterView";

const EditMonster = () => {
  const { id } = useParams();
  const { data: monster, isLoading } = useQuery({
    queryKey: ["monster", id],
    queryFn: () => fetchApi<Monster>(`/api/monsters/${id}`),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!monster) {
    return <div>Monster not found</div>;
  }

  return <BuildMonster existingMonster={monster} />;
};

export default EditMonster;
