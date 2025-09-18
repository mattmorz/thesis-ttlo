"use client";
import { Search } from "lucide-react";
import { useDebounceCallback } from "usehooks-ts";
import { useQueryState } from "nuqs";
import InputWithIcon from "@/components/ui/input-with-icon";

interface SearchWithNuqsProps {
  placeholder: string;
  inputClassName?: string;
  wrapperClassName?: string;
}

export default function SearchWithNuqs({
  placeholder,
  inputClassName,
  wrapperClassName,
}: SearchWithNuqsProps) {
  const [search, setSearch] = useQueryState("search");
  const debouncedSearch = useDebounceCallback(setSearch, 500);
  return (
    <InputWithIcon
      icon={<Search />}
      placeholder={placeholder ?? "Search..."}
      inputClassName={inputClassName}
      wrapperClassName={wrapperClassName ?? "w-full"}
      defaultValue={search ?? ""}
      onChange={(event) => debouncedSearch(event.target.value)}
    />
  );
}
