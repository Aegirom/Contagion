import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  evaluateSandboxFile,
  getSandboxExecutions,
  getSandboxSubmissions,
} from "../../services/api";
import TurnstileWidget from "../../components/TurnstileWidget";

const severityStyles = {
  Critical: "text-red-400 border-red-500/40 bg-red-500/10",
  High: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  Medium: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  Low: "text-green-400 border-green-400/40 bg-green-400/10",
};

const toDateTime = (value) => {
  if (!value) return "Pending";
  return new Date(value).toLocaleString();
};

const CountTile = ({ label, value, accent = "text-slate-100" }) => (
  <div className="rounded border border-phantom bg-obsidian/80 px-4 py-3">
    <p className="font-code text-[10px] uppercase tracking-[0.2em] text-slate-500">
      {label}
    </p>
    <p className={`mt-2 font-code text-2xl font-semibold ${accent}`}>
      {value ?? 0}
    </p>
  </div>
);

const formatItem = (item) => {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    if (item.address) return item.address;
    if (item.domain) return item.domain;
    if (item.ip) return item.ip;
    if (item.path) return item.path;
    if (item.file_name) return item.file_name;
    if (item.command_line) return item.command_line;
    if (item.process_name) return item.process_name;
    if (item.name) return item.name;
    return Object.values(item).filter(v => typeof v === "string").join(" ") || JSON.stringify(item);
  }
  return String(item);
};

const getItemMeta = (item) => {
  if (typeof item === "object" && item !== null) {
    const meta = [];
    if (item.method) meta.push(item.method);
    if (item.protocol) meta.push(item.protocol);
    if (item.port) meta.push(`:${item.port}`);
    if (item.status) meta.push(item.status);
    if (item.type) meta.push(item.type);
    if (item.severity) meta.push(item.severity);
    return meta.length ? meta.join(" · ") : null;
  }
  return null;
};

const BehaviorRow = ({ label, items, maxShow = 5, icon }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded border border-phantom bg-obsidian/60 p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-slate-500">{icon}</span>}
        <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <span className="ml-auto font-code text-[9px] text-slate-600">{items.length}</span>
      </div>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {items.slice(0, maxShow).map((item, i) => {
          const primary = formatItem(item);
          const meta = getItemMeta(item);
          return (
            <div key={i} className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-white/5">
              <span className="font-code text-[11px] text-slate-300 truncate" title={primary}>
                {primary}
              </span>
              {meta && (
                <span className="flex-shrink-0 font-code text-[9px] text-slate-600 truncate max-w-[120px]">
                  {meta}
                </span>
              )}
            </div>
          );
        })}
        {items.length > maxShow && (
          <p className="font-code text-[10px] text-slate-600 pt-1 text-center">
            +{items.length - maxShow} more
          </p>
        )}
      </div>
    </div>
  );
};

const DetectionList = ({ stats }) => {
  if (!stats) return null;
  const engines = Object.entries(stats)
    .filter(([key]) => !["malicious", "suspicious", "harmless", "undetected", "timeout", "confirmed-timeout", "failure", "type-unsupported"].includes(key))
    .map(([engine, verdict]) => ({ engine, verdict }));

  if (engines.length === 0) return null;

  return (
    <div className="rounded border border-phantom bg-obsidian/60 p-3">
      <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">
        Engine Verdicts
      </p>
      <div className="max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {engines.map(({ engine, verdict }) => (
          <div key={engine} className="flex items-center justify-between py-0.5">
            <span className="font-code text-[11px] text-slate-400 truncate">
              {engine}
            </span>
            <span
              className={`ml-2 flex-shrink-0 font-code text-[10px] uppercase ${
                verdict === "malicious"
                  ? "text-red-400"
                  : verdict === "suspicious"
                  ? "text-amber-400"
                  : "text-slate-500"
              }`}
            >
              {verdict}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function SandboxPage() {
  const [searchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(searchParams.get("submission") || "");
  const [fileHash, setFileHash] = useState("");
  const [networkEnabled, setNetworkEnabled] = useState(false);
  const [osProfile, setOsProfile] = useState("Windows10");
  const [environment, setEnvironment] = useState("Docker");
  const [timeoutSeconds, setTimeoutSeconds] = useState(120);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [latestResult, setLatestResult] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);

  const handleTurnstileToken = useCallback((token) => {
    setTurnstileToken(token);
  }, []);

  const selectedSubmission = useMemo(
    () =>
      submissions.find(
        (item) => String(item.submission_id) === String(selectedSubmissionId),
      ),
    [selectedSubmissionId, submissions],
  );

  const selectedHasHash = Boolean(selectedSubmission?.sha256_hash);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [submissionsRes, executionsRes] = await Promise.all([
        getSandboxSubmissions(),
        getSandboxExecutions(),
      ]);

      const submissionRows = Array.isArray(submissionsRes.data)
        ? submissionsRes.data
        : [];
      setSubmissions(submissionRows);
      setExecutions(
        Array.isArray(executionsRes.data) ? executionsRes.data : [],
      );

      if (!selectedSubmissionId && submissionRows[0]) {
        setSelectedSubmissionId(String(submissionRows[0].submission_id));
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load sandbox data");
    } finally {
      setLoading(false);
    }
  }, [selectedSubmissionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRun = async (event) => {
    event.preventDefault();
    if (!turnstileToken) { setError("Please complete the security verification"); return; }
    setRunning(true);
    setError("");
    setLatestResult(null);

    try {
      const response = await evaluateSandboxFile({
        submission_id: Number(selectedSubmissionId),
        file_hash: fileHash.trim() || undefined,
        environment,
        os_profile: osProfile,
        network_enabled: networkEnabled,
        timeout_seconds: Number(timeoutSeconds),
      }, turnstileToken);

      setLatestResult(response.data);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || "Sandbox evaluation failed");
    } finally {
      setRunning(false);
    }
  };

  const latestStats = latestResult?.verdict?.stats;
  const latestSeverity = latestResult?.verdict?.severity;

  return (
    <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto relative z-10 px-6 py-10 text-slate-100 md:px-8 lg:px-12">
      <div className="mb-8 flex flex-col gap-4 border-b border-phantom pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-6 w-1 bg-toxic shadow-[0_0_8px_#22C55E]" />
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-100">
              Sandbox Execution
            </h1>
          </div>
          <p className="max-w-3xl text-sm text-slate-400">
            Submit a known file hash for sandbox intelligence and persist the
            result against a Contagion submission.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded border border-phantom bg-obsidian px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-toxic shadow-[0_0_10px_#22C55E]" />
          <span className="font-code text-[10px] uppercase tracking-[0.24em] text-toxic">
            Sandbox Ready
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-500/40 bg-red-500/10 px-4 py-3 font-code text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(340px,420px)_1fr]">
        <form
          onSubmit={handleRun}
          className="glass-panel rounded-lg p-5 shadow-card"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.22em] text-slate-200">
              Execution Parameters
            </h2>
            <span className="rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 font-code text-[10px] uppercase tracking-widest text-cyan-300">
              Hash Lookup
            </span>
          </div>

          <label className="mb-4 block">
            <span className="mb-2 block font-code text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Submission
            </span>
            <select
              value={selectedSubmissionId}
              onChange={(event) => setSelectedSubmissionId(event.target.value)}
              className="w-full rounded border border-phantom bg-void px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-toxic"
              required
            >
              {submissions.map((submission) => (
                <option
                  key={submission.submission_id}
                  value={submission.submission_id}
                >
                  #{submission.submission_id} - {submission.title}
                </option>
              ))}
            </select>
          </label>

          <label className="mb-4 block">
            <span className="mb-2 block font-code text-[10px] uppercase tracking-[0.2em] text-slate-500">
              File Hash {selectedHasHash ? "(optional)" : "(required)"}
            </span>
            <input
              value={fileHash}
              onChange={(event) => setFileHash(event.target.value)}
              placeholder={
                selectedHasHash
                  ? selectedSubmission.sha256_hash
                  : "MD5, SHA-1, or SHA-256"
              }
              className="w-full rounded border border-phantom bg-void px-3 py-3 font-code text-xs text-slate-100 outline-none transition focus:border-toxic"
              required={!selectedHasHash}
            />
          </label>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block font-code text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Environment
              </span>
              <select
                value={environment}
                onChange={(event) => setEnvironment(event.target.value)}
                className="w-full rounded border border-phantom bg-void px-3 py-3 text-sm text-slate-100 outline-none focus:border-toxic"
              >
                <option>Docker</option>
                <option>VirtualBox</option>
                <option>KVM</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block font-code text-[10px] uppercase tracking-[0.2em] text-slate-500">
                OS Profile
              </span>
              <select
                value={osProfile}
                onChange={(event) => setOsProfile(event.target.value)}
                className="w-full rounded border border-phantom bg-void px-3 py-3 text-sm text-slate-100 outline-none focus:border-toxic"
              >
                <option>Windows10</option>
                <option>Windows11</option>
                <option>Ubuntu22</option>
              </select>
            </label>
          </div>

          <label className="mb-5 block">
            <span className="mb-2 block font-code text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Timeout Seconds
            </span>
            <input
              type="number"
              min="30"
              max="600"
              value={timeoutSeconds}
              onChange={(event) => setTimeoutSeconds(event.target.value)}
              className="w-full rounded border border-phantom bg-void px-3 py-3 font-code text-sm text-slate-100 outline-none focus:border-toxic"
            />
          </label>

          <label className="mb-6 flex cursor-pointer items-center justify-between rounded border border-phantom bg-void px-4 py-3">
            <span>
              <span className="block font-code text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Network Enabled
              </span>
              <span className="text-xs text-slate-600">
                Stored with the execution metadata
              </span>
            </span>
            <input
              type="checkbox"
              checked={networkEnabled}
              onChange={(event) => setNetworkEnabled(event.target.checked)}
              className="h-5 w-5 accent-toxic"
            />
          </label>

          <TurnstileWidget onToken={handleTurnstileToken} />

          <button
            type="submit"
            disabled={running || loading || submissions.length === 0 || !turnstileToken}
            className="w-full rounded-lg bg-toxic px-5 py-3 font-display text-xs font-bold uppercase tracking-[0.22em] text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Evaluating..." : "Run Sandbox Evaluation"}
          </button>
        </form>

        <section className="min-w-0 space-y-6">
          {selectedSubmission?.file_name && (
            <div className="glass-panel rounded-lg p-5 shadow-card">
              <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.22em] text-slate-200">
                Artifact Metadata
              </h2>
              <div className="rounded border border-phantom bg-void p-4">
                <p className="text-sm font-semibold text-slate-100">
                  {selectedSubmission.file_name}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      SHA-256
                    </p>
                    <p className="mt-1 break-all font-code text-[11px] text-slate-300">
                      {selectedSubmission.sha256_hash || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      MD5
                    </p>
                    <p className="mt-1 break-all font-code text-[11px] text-slate-300">
                      {selectedSubmission.md5_hash || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      SHA-1
                    </p>
                    <p className="mt-1 break-all font-code text-[11px] text-slate-300">
                      {selectedSubmission.sha1_hash || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Size
                    </p>
                    <p className="mt-1 font-code text-[11px] text-slate-300">
                      {selectedSubmission.file_size
                        ? `${Number(selectedSubmission.file_size).toLocaleString()} bytes`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Type
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {selectedSubmission.file_type || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Storage Path
                    </p>
                    <p className="mt-1 break-all font-code text-[11px] text-slate-300">
                      {selectedSubmission.storage_path || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Malware Family
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {selectedSubmission.malware_family || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Category
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {selectedSubmission.malware_category || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Uploaded
                    </p>
                    <p className="mt-1 font-code text-[11px] text-slate-300">
                      {selectedSubmission.upload_time
                        ? toDateTime(selectedSubmission.upload_time)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Quarantined
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {selectedSubmission.is_quarantined ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <CountTile
              label="Malicious"
              value={latestStats?.malicious}
              accent="text-red-400"
            />
            <CountTile
              label="Suspicious"
              value={latestStats?.suspicious}
              accent="text-amber-400"
            />
            <CountTile
              label="Harmless"
              value={latestStats?.harmless}
              accent="text-green-400"
            />
            <CountTile
              label="Undetected"
              value={latestStats?.undetected}
              accent="text-slate-300"
            />
          </div>

          <div className="glass-panel rounded-lg p-5 shadow-card">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.22em] text-slate-200">
                Latest Evaluation
              </h2>
              {latestSeverity && (
                <span
                  className={`w-fit rounded border px-3 py-1 font-code text-[10px] uppercase tracking-widest ${severityStyles[latestSeverity]}`}
                >
                  {latestSeverity}
                </span>
              )}
            </div>

            {latestResult ? (
              <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                <div className="rounded border border-phantom bg-void p-4">
                  <p className="font-code text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Artifact
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-100">
                    {latestResult.file?.name || "Unnamed sample"}
                  </p>
                  <p className="mt-3 break-all font-code text-[11px] text-slate-500">
                    {latestResult.file?.sha256}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-code uppercase tracking-widest text-slate-600">
                        Type
                      </p>
                      <p className="mt-1 text-slate-300">
                        {latestResult.file?.type || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="font-code uppercase tracking-widest text-slate-600">
                        Size
                      </p>
                      <p className="mt-1 text-slate-300">
                        {latestResult.file?.size || 0} bytes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 rounded border border-phantom bg-void p-4">
                  <p className="font-code text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Behavior Summary
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <CountTile
                      label="Domains"
                      value={latestResult.behavior?.contacted_domains?.length}
                      accent="text-cyan-300"
                    />
                    <CountTile
                      label="Processes"
                      value={latestResult.behavior?.processes_created?.length}
                      accent="text-slate-200"
                    />
                    <CountTile
                      label="Files Written"
                      value={latestResult.behavior?.files_written?.length}
                      accent="text-slate-200"
                    />
                  </div>
                  <div className="mt-4 space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    <BehaviorRow
                      label="Contacted Domains"
                      items={latestResult.behavior?.contacted_domains}
                    />
                    <BehaviorRow
                      label="Processes Created"
                      items={latestResult.behavior?.processes_created}
                    />
                    <BehaviorRow
                      label="Files Opened"
                      items={latestResult.behavior?.files_opened}
                    />
                    <BehaviorRow
                      label="Files Written"
                      items={latestResult.behavior?.files_written}
                    />
                    <BehaviorRow
                      label="Files Deleted"
                      items={latestResult.behavior?.files_deleted}
                    />
                    <BehaviorRow
                      label="Registry Keys Set"
                      items={latestResult.behavior?.registry_keys_set}
                    />
                    <BehaviorRow
                      label="HTTP Conversations"
                      items={latestResult.behavior?.http_conversations}
                    />
                    <BehaviorRow
                      label="Command Executions"
                      items={latestResult.behavior?.command_executions}
                    />
                    <BehaviorRow
                      label="Processes Terminated"
                      items={latestResult.behavior?.processes_terminated}
                    />
                    <BehaviorRow
                      label="IP Traffic"
                      items={latestResult.behavior?.ip_traffic}
                    />
                    <BehaviorRow
                      label="DNS Lookups"
                      items={latestResult.behavior?.dns_lookups}
                    />
                    <BehaviorRow
                      label="Tags"
                      items={latestResult.behavior?.tags}
                    />
                    <DetectionList stats={latestResult.verdict?.stats} />
                    {latestResult.verdict?.suggestedThreatLabel && (
                      <div className="rounded border border-red-500/30 bg-red-500/10 p-3">
                        <p className="font-code text-[10px] uppercase tracking-[0.18em] text-red-400 mb-1">
                          Threat Label
                        </p>
                        <p className="font-code text-[11px] text-red-300">
                          {latestResult.verdict.suggestedThreatLabel}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded border border-dashed border-phantom py-16 text-center">
                <p className="font-code text-xs uppercase tracking-[0.2em] text-slate-500">
                  Run an evaluation to populate the active report panel.
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-lg p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.22em] text-slate-200">
                Execution History
              </h2>
              <span className="font-code text-[10px] uppercase tracking-[0.2em] text-slate-600">
                {executions.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-phantom font-code text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Submission</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Artifact</th>
                    <th className="pb-3">Finished</th>
                    <th className="pb-3">Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((execution) => (
                    <tr
                      key={execution.execution_id}
                      className="border-b border-phantom/70 text-sm text-slate-300"
                    >
                      <td className="py-4 font-code text-slate-500">
                        #{execution.execution_id}
                      </td>
                      <td className="py-4">{execution.submission_title}</td>
                      <td className="py-4">
                        <span className="rounded border border-toxic/30 bg-toxic/10 px-2 py-1 font-code text-[10px] uppercase tracking-widest text-toxic">
                          {execution.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <p>{execution.file_name}</p>
                        <p className="mt-1 max-w-[220px] truncate font-code text-[10px] text-slate-600">
                          {execution.sha256_hash}
                        </p>
                      </td>
                      <td className="py-4 font-code text-xs text-slate-500">
                        {toDateTime(execution.finished_at)}
                      </td>
                      <td className="py-4 font-code text-xs text-slate-500">
                        {(execution.logs || []).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && executions.length === 0 && (
              <div className="py-12 text-center font-code text-xs uppercase tracking-[0.2em] text-slate-600">
                No sandbox executions stored yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default SandboxPage;
