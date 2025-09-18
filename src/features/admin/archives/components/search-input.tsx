// "use client";
// import { Search } from "lucide-react";
// import { useDebounceCallback } from "usehooks-ts";
// import { useQueryState } from "nuqs";
// import InputWithIcon from "@/components/ui/input-with-icon";

// export default function ArchiveSearchInput() {
//   const [search, setSearch] = useQueryState("search");
//   const debouncedSearch = useDebounceCallback(setSearch, 500);
//   return (
//     <InputWithIcon
//       icon={<Search />}
//       placeholder="Search by project title or inventors..."
//       wrapperClassName="w-96"
//       defaultValue={search ?? ""}
//       onChange={(event) => debouncedSearch(event.target.value)}
//     />
//   );
// }

"use client";
import { Search } from "lucide-react";
import { useDebounceCallback } from "usehooks-ts";
import InputWithIcon from "@/components/ui/input-with-icon";
import useArchiveFiltersStore from "../hooks/archive-filter-store";

export default function ArchiveSearchInput() {
  const { setFilters } = useArchiveFiltersStore();
  const debouncedSearch = useDebounceCallback(
    (value: string) => setFilters({ search: value }),
    500
  );
  return (
    <InputWithIcon
      icon={<Search />}
      placeholder="Search by project title or inventors..."
      wrapperClassName="w-96"
      onChange={(event) => debouncedSearch(event.target.value)}
    />
  );
}
