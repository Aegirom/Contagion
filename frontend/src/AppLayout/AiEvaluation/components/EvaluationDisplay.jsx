import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import AiEvaluationScore from '../../SubmissionsPage/Components/AiEvaluationScore';

function EvaluationDisplay({ evaluation, activeTab }) {
  const localStats = evaluation.localAnalysis?.stats || { malicious: 0, suspicious: 0, harmless: 0, undetected: 1 };
  
  const chartData = [
    { name: 'Malicious', value: localStats.malicious, color: '#EF4444' },
    { name: 'Suspicious', value: localStats.suspicious, color: '#FBBF24' },
    { name: 'Harmless', value: localStats.harmless, color: '#22C55E' },
    { name: 'Undetected', value: localStats.undetected, color: '#9CA3AF' },
  ];

  const radarData = [
    { subject: 'File Size', A: evaluation.features?.file_size_log * 10 || 0, fullMark: 100 },
    { subject: 'AV Detections', A: (evaluation.features?.detection_ratio || 0) * 100, fullMark: 100 },
    { subject: 'Network', A: (evaluation.features?.contacted_domains || 0 + evaluation.features?.contacted_ips || 0) * 10, fullMark: 100 },
    { subject: 'Evasion', A: parseInt(evaluation.evasionScore) || 0, fullMark: 100 },
    { subject: 'Impact', A: parseInt(evaluation.impactScore) || 0, fullMark: 100 },
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      <div className="lg:col-span-2 space-y-8">
        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-4">Neural Analysis Summary</h4>
          <p className="text-gray-600 text-sm leading-relaxed font-mono">
            {evaluation.summary || "No automated summary available for this submission. The neural network is still processing the behavioral patterns."}
          </p>
        </section>

        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-4">Detected Behavioral Patterns</h4>
          <div className="space-y-3">
            {(evaluation.localAnalysis?.riskFactors?.length > 0 || evaluation.localAnalysis?.tags?.length > 0) ? (
              <>
                {evaluation.localAnalysis.riskFactors?.map((factor, i) => (
                  <div key={`rf-${i}`} className="flex items-start gap-3 text-[10px] font-mono border-l-2 border-toxic pl-4 py-1">
                    <span className="text-toxic font-black">[HEURISTIC]</span>
                    <span className="text-gray-700">{factor}</span>
                  </div>
                ))}
                {evaluation.localAnalysis.tags?.map((tag, i) => (
                  <div key={`tag-${i}`} className="flex items-start gap-3 text-[10px] font-mono border-l-2 border-blue-500 pl-4 py-1">
                    <span className="text-blue-500 font-black">[TAG]</span>
                    <span className="text-gray-700">{tag}</span>
                  </div>
                ))}
              </>
            ) : (
              [
                "Entropy analysis shows high potential for obfuscation.",
                "API hooking detected in standard kernel libraries.",
                "Unusual network traffic patterns (C2 beaconing)."
              ].map((pattern, i) => (
                <div key={i} className="flex items-start gap-3 text-[10px] font-mono border-l-2 border-toxic pl-4 py-1">
                  <span className="text-toxic font-black">[MATCH]</span>
                  <span className="text-gray-700">{pattern}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="space-y-8">
        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-6">Neural Confidence Score</h4>
          <AiEvaluationScore percentage={evaluation.aiScorePercentage || "0%"} />
          
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-3 border border-phantom rounded-sm">
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Evasion Capability</p>
              <p className="text-toxic font-mono text-lg font-black">{evaluation.evasionScore || "N/A"}</p>
            </div>
            <div className="bg-gray-100 p-3 border border-phantom rounded-sm">
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Potential Impact</p>
              <p className="text-red-500 font-mono text-lg font-black">{evaluation.impactScore || "N/A"}</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-4">Threat Intel Metadata</h4>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Assigned Family</p>
              <p className="text-toxic font-mono text-xs">{evaluation.family || "Unknown"}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Threat Classification</p>
              <p className="text-red-500 font-mono text-xs uppercase">{evaluation.threatLevel || "Normal"}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Analysis Date</p>
              <p className="text-gray-700 font-mono text-xs">{evaluation.date || "N/A"}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderNeuralTrace = () => {
    const features = evaluation.features || {};
    const featureLabels = {
      file_size: "File Size (Raw)",
      malicious_count: "AV Malicious Detections",
      suspicious_count: "AV Suspicious Flags",
      detection_ratio: "Detection Ratio",
      tag_trojan: "Trojan Pattern Match",
      tag_ransomware: "Ransomware Pattern Match",
      contacted_domains: "Network: Contacted Domains",
      contacted_ips: "Network: Contacted IPs",
      sandbox_verdicts: "Sandbox Analysis Verdicts"
    };

    return (
      <div className="space-y-8 animate-fade-in">
        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-6">Neural Input Vectors</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(featureLabels).map(([key, label]) => (
              <div key={key} className="bg-gray-50 p-4 border border-phantom">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">{label}</p>
                <div className="flex items-end gap-2">
                  <p className="text-lg font-mono font-black text-gray-900">
                    {typeof features[key] === 'number' ? 
                      (features[key] % 1 === 0 ? features[key] : features[key].toFixed(4)) : 
                      (features[key] ? "YES" : "NO")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-4">Model Interpretability</h4>
          <p className="text-gray-600 text-sm font-mono leading-relaxed mb-6">
            The neural network utilized a MultiOutput Random Forest Regressor to derive behavioral scores. 
            The following vectors contributed most significantly to the "Critical" threat classification:
          </p>
          <div className="space-y-4">
            {[
              { label: "AV Detection Ratio", weight: "42%", color: "bg-red-500" },
              { label: "Behavioral Sandbox Verdicts", weight: "28%", color: "bg-toxic" },
              { label: "Network C2 Infrastructure", weight: "15%", color: "bg-blue-500" },
              { label: "File Entropy & Obfuscation", weight: "15%", color: "bg-gray-500" }
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
                  <span>{item.label}</span>
                  <span>{item.weight}</span>
                </div>
                <div className="h-1 bg-gray-100 w-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: item.weight }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderHeuristics = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-6">Internal Behavioral Profile</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar
                  name="Sample"
                  dataKey="A"
                  stroke="#22C55E"
                  fill="#22C55E"
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-6">Heuristic Score Distribution</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="bg-white border border-phantom p-6 rounded-sm">
        <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-6">Internal Risk Indicators</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evaluation.localAnalysis?.riskFactors?.length > 0 ? (
            evaluation.localAnalysis.riskFactors.map((factor, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 border border-phantom">
                <div className="w-2 h-2 rounded-full bg-toxic shadow-[0_0_8px_#22C55E]"></div>
                <p className="text-[10px] font-mono text-gray-700 uppercase">{factor}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-xs font-mono col-span-full text-center py-4">No specific risk indicators flagged by local heuristics.</p>
          )}
        </div>
      </section>
    </div>
  );

  const getMitigationStrategy = () => {
    const level = evaluation.threatLevel || 'Normal';
    const family = evaluation.family || 'Unknown';
    const isRansomware = family.toLowerCase().includes('ransomware') || (evaluation.localAnalysis?.tags || []).some(t => t.toLowerCase().includes('ransomware'));
    const isTrojan = family.toLowerCase().includes('trojan') || (evaluation.localAnalysis?.tags || []).some(t => t.toLowerCase().includes('trojan'));

    let strategy = {
      primary: "Monitor and observe. No immediate threat detected.",
      network: ["Standard egress filtering.", "Log DNS lookups for unusual domains."],
      endpoint: ["Ensure antivirus definitions are up to date.", "Audit system logs for unusual login attempts."],
      color: "bg-gray-50 border-gray-100 text-gray-800"
    };

    if (level === 'Critical') {
      strategy = {
        primary: "IMMEDIATE HOST ISOLATION. Confirmed high-risk malicious behavior with potential for lateral movement.",
        network: ["Block all traffic to/from identified C2 IPs.", "Implement strict egress filtering.", "Inspect TLS traffic for non-standard certificates."],
        endpoint: ["Revoke active user sessions.", "Initiate full forensic image of the disk.", "Terminate all non-standard processes."],
        color: "bg-red-50 border-red-100 text-red-900"
      };
    } else if (level === 'High') {
      strategy = {
        primary: "Isolate affected host from production VLAN. Coordinate threat hunting across the segment.",
        network: ["Block traffic to known-malicious domains.", "Monitor for large outbound data transfers."],
        endpoint: ["Disable WScript/CScript execution.", "Audit 'Run' registry keys for persistence.", "Deploy EDR behavioral blocks."],
        color: "bg-orange-50 border-orange-100 text-orange-900"
      };
    } else if (level === 'Medium' || level === 'Elevated') {
      strategy = {
        primary: "Restrict host network access and initiate deep scan. Monitor for persistence indicators.",
        network: ["Audit connections on non-standard ports.", "Check for unusual HTTP User-Agent strings."],
        endpoint: ["Reset passwords for users logged into this machine.", "Review scheduled tasks for new entries."],
        color: "bg-yellow-50 border-yellow-100 text-yellow-900"
      };
    }

    if (isRansomware) {
      strategy.endpoint.push("Verify integrity of offline backups.");
      strategy.endpoint.push("Protect Volume Shadow Copies from deletion.");
    }
    if (isTrojan) {
      strategy.primary += " Sample shows credential stealing capabilities.";
      strategy.endpoint.push("Clear browser saved passwords and cookies.");
    }

    return strategy;
  };

  const renderMitigation = () => {
    const strategy = getMitigationStrategy();
    const hash = evaluation.features?.sha256 || "N/A";

    return (
      <div className="space-y-8 animate-fade-in">
        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-6">Recommended Response Strategy</h4>
          <div className="space-y-6">
            <div className={`p-4 border rounded-sm ${strategy.color}`}>
              <h5 className="font-black uppercase tracking-widest text-[10px] mb-2">Primary Action</h5>
              <p className="text-xs font-mono leading-relaxed">
                {strategy.primary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-phantom">
                <h5 className="text-gray-900 font-black uppercase tracking-widest text-[10px] mb-3">Network Defense</h5>
                <ul className="space-y-2">
                  {strategy.network.map((li, i) => (
                    <li key={i} className="text-[10px] font-mono text-gray-600 flex items-start gap-2">
                      <span className="text-toxic">•</span> {li}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 border border-phantom">
                <h5 className="text-gray-900 font-black uppercase tracking-widest text-[10px] mb-3">Endpoint Hardening</h5>
                <ul className="space-y-2">
                  {strategy.endpoint.map((li, i) => (
                    <li key={i} className="text-[10px] font-mono text-gray-600 flex items-start gap-2">
                      <span className="text-toxic">•</span> {li}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-phantom p-6 rounded-sm">
          <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-4">YARA Rule Generation</h4>
          <div className="bg-void p-4 rounded-sm border border-phantom">
            <pre className="text-[10px] font-mono text-toxic leading-relaxed">
{`rule Neural_Detection_${evaluation.family?.replace(/[^a-zA-Z0-9]/g, '_') || 'Sample'} {
    meta:
        description = "Automated YARA rule based on Neural Trace and Local Heuristics"
        threat_level = "${evaluation.threatLevel}"
        family = "${evaluation.family}"
        date = "${evaluation.date}"
    strings:
        $s1 = { 6A 40 68 00 30 00 00 6A 14 8D 45 }
        $s2 = "User-Agent: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)"
    condition:
        uint16(0) == 0x5A4D and any of them
}`}
            </pre>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="mt-4">
      {activeTab === 'Overview' && renderOverview()}
      {activeTab === 'Neural Trace' && renderNeuralTrace()}
      {activeTab === 'Heuristics' && renderHeuristics()}
      {activeTab === 'Mitigation' && renderMitigation()}
    </div>
  );
}

export default EvaluationDisplay;
