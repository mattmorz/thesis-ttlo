"use client";
import { Badge, Button, Dialog, DialogTrigger } from "@/components/ui";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterDialog } from "@/features/admin/archives/components/filter-dialog";
import ArchiveSearchInput from "@/features/admin/archives/components/search-input";
import { cn, formatDate } from "@/lib/utils";
import { underscoreToSpace } from "@/lib/utils";
import { RouterOutputs, trpc } from "@/trpc/client";
import { ChevronRight, LayoutGrid, Rows3 } from "lucide-react";
import useArchiveFiltersStore from "../hooks/archive-filter-store";
import { LoadingSpinner } from "@/components/global/loading-spinner";
import { ProjectDetailsModal } from "@/features/admin/archives/components/project-details-modal";
import Link from "next/link";

type ArchivesGetOutput = RouterOutputs["archives"]["get"];

export function ArchivesContent() {
  const { filters } = useArchiveFiltersStore();
  const { data, isPending } = trpc.archives.get.useQuery(filters);

  return (
    <Card>
      <Tabs defaultValue="grid" className="items-center">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <ArchiveSearchInput />
            <div className="space-x-2">
              <FilterDialog />
              <TabsList>
                <TabsTrigger
                  value="grid"
                  className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                >
                  <LayoutGrid className="size-4" />
                </TabsTrigger>
                <TabsTrigger
                  value="row"
                  className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                >
                  <Rows3 className="size-4" />
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPending && <LoadingSpinner />}
          {!isPending && data && data.length < 1 && <EmptyData />}
          <TabsContent value="grid" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data &&
                data.map((item, index) => (
                  <GridView data={item} key={`grid-${index}`} />
                ))}
            </div>
          </TabsContent>
          <TabsContent value="row">
            <div className="space-y-2">
              {data &&
                data.map((item, index) => (
                  <RowView data={item} key={`row-${index}`} />
                ))}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

interface DataTypeProps {
  data: ArchivesGetOutput[number]; // Use the inferred type for each item in the array;
}

function GridView({ data }: DataTypeProps) {
  const getBadgeColor = (status: string | null | undefined) => {
    switch (status) {
      case "patent":
        return "bg-violet-50 text-violet-700";
      case "copyright":
        return "bg-blue-50 text-blue-700";
      case "trademark":
        return "bg-emerald-50 text-emerald-700";
      case "utility_model":
        return "bg-indigo-50 text-indigo-700";
      case "industrial_design":
        return "bg-amber-50 text-amber-700";
      case "trade_secret":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };
  return (
    <Card className="cursor-pointer hover:bg-muted transition-all">
      <div className="flex items-start justify-between p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-lg">
              {data.ip_application?.title}
            </h4>
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                getBadgeColor(data.ip_application?.ipType)
              )}
            >
              {underscoreToSpace(data.ip_application?.ipType)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {data.ip_application?.description}
          </p>
        </div>
      </div>
      <CardFooter className="flex items-center justify-end">
        <Button size="sm" asChild>
          <Link href={`/admin/projects/${data.ip_application?.id}`}>
            View Dashboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function RowView({ data }: DataTypeProps) {
  const getBadgeColor = (status: string | null | undefined) => {
    switch (status) {
      case "patent":
        return "bg-violet-50 text-violet-700";
      case "copyright":
        return "bg-blue-50 text-blue-700";
      case "trademark":
        return "bg-emerald-50 text-emerald-700";
      case "utility_model":
        return "bg-indigo-50 text-indigo-700";
      case "industrial_design":
        return "bg-amber-50 text-amber-700";
      case "trade_secret":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{data.ip_application?.title}</h3>
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              getBadgeColor(data.ip_application?.ipType)
            )}
          >
            {underscoreToSpace(data.ip_application?.ipType)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.ip_application?.department}
        </p>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-sm text-muted-foreground">
          Archived: {formatDate(data.archives.archiveAt ?? new Date())}
        </div>
        <Button size="sm" asChild>
          <Link href={`/admin/projects/${data.ip_application?.id}`}>
            View Dashboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyData() {
  return (
    <div className="size-full p-10 text-center text-muted-foreground">
      <p>No results.</p>
    </div>
  );
}
