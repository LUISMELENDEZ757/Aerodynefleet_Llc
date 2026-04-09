import React, { useEffect, useState } from "react";

function AocsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [summary, setSummary] = useState(null);
  const [flights, setFlights] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchAocsData() {
      try {
        setIsLoading(true);
        setHasError(false);

        // TODO: Replace with your real API endpoints
        const [summaryRes, flightsRes, alertsRes, timelineRes] =
          await Promise.all([
            fetch("/api/aocs/summary"),
            fetch("/api/aocs/flights"),
            fetch("/api/aocs/alerts"),
            fetch("/api/aocs/timeline"),
          ]);

        if (!isMounted) return;

        if (
          !summaryRes.ok ||
          !flightsRes.ok ||
          !alertsRes.ok ||
          !timelineRes.ok
        ) {
          throw new Error("Failed to load AOCS data");
        }

        const summaryData = await summaryRes.json();
        const flightsData = await flightsRes.json();
        const alertsData = await alertsRes.json();
        const timelineData = await timelineRes.json();

        setSummary(summaryData);
        setFlights(flightsData);
        setAlerts(alertsData);
        setTimeline(timelineData);
      } catch (err) {
        console.error("AOCS Dashboard error:", err);
        if (isMounted) setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAocsData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="page page-aocs">
        <div className="page-loading">Loading AOCS Dashboard…</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="page page-aocs">
        <div className="page-error">
          Unable to load AOCS Dashboard.
          <br />
          Check network / API and try again.
        </div>
      </div>
    );
  }

  return (
    <div className="page page-aocs">
      <AocsHeader />
      <AocsSummaryBar summary={summary} />
      <div className="page-grid">
        <div className="page-grid-main">
          <AocsFlightsPanel flights={flights} />
        </div>
        <div className="page-grid-side">
          <AocsAlertsPanel alerts={alerts} />
          <AocsTimelinePanel timeline={timeline} />
        </div>
      </div>
    </div>
  );
}

function AocsHeader() {
  return (
    <header className="page-header">
      <div>
        <h1>AOCS Dashboard</h1>
        <p>Network status, disruptions, and control actions in one view.</p>
      </div>
      <div className="page-header-actions">
        <button className="btn btn-primary">New Control Action</button>
        <button className="btn btn-ghost">Refresh</button>
      </div>
    </header>
  );
}

function AocsSummaryBar({ summary }) {
  if (!summary) return null;

  const {
    totalFlights = 0,
    delayedFlights = 0,
    cancelledFlights = 0,
    diversions = 0,
    oosAircraft = 0,
  } = summary;

  return (
    <section className="summary-bar">
      <SummaryTile label="Total Flights" value={totalFlights} />
      <SummaryTile label="Delayed" value={delayedFlights} tone="warning" />
      <SummaryTile label="Cancelled" value={cancelledFlights} tone="danger" />
      <SummaryTile label="Diversions" value={diversions} tone="warning" />
      <SummaryTile label="A/C OOS" value={oosAircraft} tone="danger" />
    </section>
  );
}

function SummaryTile({ label, value, tone }) {
  return (
    <div className={`summary-tile ${tone ? `summary-tile-${tone}` : ""}`}>
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
    </div>
  );
}

function AocsFlightsPanel({ flights }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Network Flights</h2>
        <span className="panel-subtitle">
          Live operating status by flight and station.
        </span>
      </div>
      <div className="panel-body panel-body-table">
        <table className="table">
          <thead>
            <tr>
              <th>Flight</th>
              <th>From</th>
              <th>To</th>
              <th>STD</th>
              <th>STA</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {flights && flights.length > 0 ? (
              flights.map((f) => (
                <tr key={f.id || `${f.flightNumber}-${f.std}`}>
                  <td>{f.flightNumber}</td>
                  <td>{f.origin}</td>
                  <td>{f.destination}</td>
                  <td>{f.std}</td>
                  <td>{f.sta}</td>
                  <td className={`status status-${(f.status || "").toLowerCase()}`}>
                    {f.status}
                  </td>
                  <td>{f.reason || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="table-empty">
                  No flights to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AocsAlertsPanel({ alerts }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Critical Alerts</h2>
      </div>
      <div className="panel-body panel-body-list">
        {alerts && alerts.length > 0 ? (
          alerts.map((a) => (
            <div
              key={a.id}
              className={`alert alert-${(a.severity || "info").toLowerCase()}`}
            >
              <div className="alert-title">{a.title}</div>
              <div className="alert-meta">
                {a.station} • {a.category} • {a.time}
              </div>
              {a.description && (
                <div className="alert-description">{a.description}</div>
              )}
            </div>
          ))
        ) : (
          <div className="panel-empty">No active alerts.</div>
        )}
      </div>
    </section>
  );
}

function AocsTimelinePanel({ timeline }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Control Actions Timeline</h2>
      </div>
      <div className="panel-body panel-body-list">
        {timeline && timeline.length > 0 ? (
          timeline.map((e) => (
            <div key={e.id} className="timeline-item">
              <div className="timeline-time">{e.time}</div>
              <div className="timeline-content">
                <div className="timeline-title">{e.title}</div>
                <div className="timeline-meta">
                  {e.station} • {e.actor} • {e.type}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="panel-empty">No recent control actions.</div>
        )}
      </div>
    </section>
  );
}

export default AocsDashboard;