import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AocsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/aocs/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-sky-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-10">
        <p className="text-lg font-semibold">Error loading AOCS data</p>
        <p className="opacity-70">{error}</p>
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
        <StatCard label="Active Flights" value={analytics.activeFlights} />
        <StatCard label="Delays" value={analytics.delays} />
        <StatCard label="Ground Ops" value={analytics.groundOps} />
        <StatCard label="Crew Issues" value={analytics.crewIssues} />
      </div>

      <Card className="bg-[#0d1117] border-[#1f2937] text-white">
        <CardHeader>
          <CardTitle>Operational Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="opacity-80 leading-relaxed">
            {analytics.summary}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}