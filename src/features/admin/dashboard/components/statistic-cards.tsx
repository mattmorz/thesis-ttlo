import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import React from "react";

interface StatisticCardsProps {
  title: string;
  description: string;
  number: number;
  href?: string;
  Icon: React.ElementType;
  children?: React.ReactNode;
  onClick?: () => void;
}

export default function StatisticCards({
  title,
  description,
  number,
  href,
  Icon,
  children,
  onClick,
}: StatisticCardsProps) {
  const Content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{number}</div>
        {children}
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </>
  );

  return (
    <Card
      onClick={href ? undefined : onClick}
      className="cursor-pointer hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1"
    >
      {href ? <Link href={href}>{Content}</Link> : <div>{Content}</div>}
    </Card>
  );
}
