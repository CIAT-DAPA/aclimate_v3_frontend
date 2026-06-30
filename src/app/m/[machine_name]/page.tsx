import { notFound } from "next/navigation";
import StationDetailClient from "./StationDetailClient";
import { getStationByMachineName } from "@/app/lib/stations.server";
import type { Station } from "@/app/types/Station";

export default async function StationDetailPage({
  params,
}: {
  params: Promise<{ machine_name: string }>;
}) {
  const { machine_name } = await params;

  const station = await getStationByMachineName(machine_name);

  if (!station) {
    notFound();
  }

  return (
    <StationDetailClient
      machineName={machine_name}
      initialStation={station as Station}
    />
  );
}
