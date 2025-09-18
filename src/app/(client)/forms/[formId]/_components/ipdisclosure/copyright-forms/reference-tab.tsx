"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { classificationData, feeScheduleData } from "./reference-data";
import { Badge } from "@/components/ui/badge";

export function ReferenceTab() {
  return (
    <Card className="mt-4">
      <CardHeader className="bg-slate-50">
        <CardTitle className="text-xl font-semibold text-[#1B5E20]">
          Reference Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="classification">
          <TabsList className="w-full mb-4 bg-slate-100">
            <TabsTrigger
              value="classification"
              className="flex-1 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20]"
            >
              Classification & Requirements
            </TabsTrigger>
            <TabsTrigger
              value="fees"
              className="flex-1 data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20]"
            >
              Schedule of Fees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classification">
            <ScrollArea className="h-[500px] w-full rounded-md border">
              <div className="p-4">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr>
                      <th className="border border-slate-300 px-4 py-3 font-semibold text-left bg-slate-50 w-[12%]">
                        Classification
                      </th>
                      <th className="border border-slate-300 px-4 py-3 font-semibold text-left bg-slate-50 w-[22%]">
                        Type of Work
                      </th>
                      <th className="border border-slate-300 px-4 py-3 font-semibold text-left bg-slate-50 w-[22%]">
                        Copy of Work for Deposit
                        <br />
                        <span className="font-normal text-sm">
                          (For Copyright Registrations Only)
                        </span>
                      </th>
                      <th className="border border-slate-300 px-4 py-3 font-semibold text-left bg-slate-50 w-[22%]">
                        Requirements for Recordation
                      </th>
                      <th className="border border-slate-300 px-4 py-3 font-semibold text-left bg-slate-50 w-[22%]">
                        Additional Requirements
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {classificationData.map((item, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        <td className="border border-slate-300 px-4 py-3 align-top">
                          <Badge
                            variant="outline"
                            className="font-bold bg-[#E8F5E9] text-[#1B5E20] border-[#1B5E20]"
                          >
                            Class {item.class}
                          </Badge>
                        </td>
                        <td className="border border-slate-300 px-4 py-3 align-top">
                          {item.type}
                        </td>
                        <td className="border border-slate-300 px-4 py-3 align-top whitespace-pre-line">
                          {item.deposit}
                        </td>
                        <td className="border border-slate-300 px-4 py-3 align-top whitespace-pre-line">
                          {item.recordation}
                        </td>
                        <td className="border border-slate-300 px-4 py-3 align-top whitespace-pre-line">
                          {item.additional}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="fees">
            <ScrollArea className="h-[500px] w-full rounded-md border">
              <div className="p-4">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr>
                      <th className="border px-4 py-3 font-semibold text-left bg-muted/80 w-[60%]">
                        Type of Fee
                      </th>
                      <th className="border px-4 py-3 font-semibold text-left bg-muted/80 w-[20%]">
                        Small Entity
                      </th>
                      <th className="border px-4 py-3 font-semibold text-left bg-muted/80 w-[20%]">
                        Big Entity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeScheduleData.map((item, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-muted/30"}
                      >
                        <td className="border px-4 py-3">{item.type}</td>
                        <td className="border px-4 py-3 font-medium">
                          {item.small}
                        </td>
                        <td className="border px-4 py-3 font-medium">
                          {item.big}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
