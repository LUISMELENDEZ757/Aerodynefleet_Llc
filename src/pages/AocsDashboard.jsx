import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const TODAY = new Date().toISOString().split("T")[0];

export default function AocsDashboard() {
  const { data: flights = [], isLoading: flightsLoading } = useQuery({
    queryKey: ["aocs-flights", TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const { data: groundOps = [], isLoading: groundLoading } = useQuery({
    queryKey: ["aocs-ground"],
    queryFn: () => base44.entities.GroundOps.list("-created_date", 100),
    refetchInterval: 60000,
  });

  const { data: crew = [], isLoading: crewLoading } = useQuery({
    queryKey: ["aocs-crew"],
    queryFn: () => base44.entities.CrewAssignment.list("-created_date", 100),
    refetchInterval: 60000,
  });

  const loading = flightsLoading || groundLoading || crewLoading;

  const activeFlights = flights.filter(
    (f) => !["arrived", "landed", "cancelled"].includes(f.status)
  ).length;

  const delays = flights.filter(
    (f) => f.status === "delayed" || (f.delay_minutes || 0) >= 15
  ).length;

  const activeGround = groundOps.filter(
    (g) => g.status !== "completed" && g.status !== "cancelled"
  ).length;

  const crewIssues = crew.filter(
    (c) => c.legal_status === "illegal" || c.legal_status === "near_limit"
  ).length;

  const summary =
    activeFlights === 0
      ? "No active flights today. Operations are quiet."
      : `${activeFlights} flight${activeFlights !== 1 ? "s" : ""} currently active. ${
          delays > 0 ? `${delays} delay${delays !== 1 ? "s" : ""} reported.` : "No delays reported."
        } ${crewIssues > 0 ? `${crewIssues} crew compliance issue${crewIssues !== 1 ? "s" : ""} flagged.` : "All crew legal."} ${
          activeGround > 0 ? `${activeGround} ground op${activeGround !== 1 ? "s" : ""} in progress.` : ""
        }`.trim();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-sky-400" />
      </div>
    );
  }

  const StatCard = ({ label, value }) => (
    <Card className="bg-[#0d1117] border-[#1f2937] text-white">
      <CardHeader>
        <CardTitle className="text-sm opacity-70">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-white">AOCS Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Flights" value={activeFlights} />
        <StatCard label="Delays" value={delays} />
        <StatCard label="Ground Ops" value={activeGround} />
        <StatCard label="Crew Issues" value={crewIssues} />
      </div>

      <Card className="bg-[#0d1117] border-[#1f2937] text-white">
        <CardHeader>
          <CardTitle>Operational Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="opacity-80 leading-relaxed">{summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}