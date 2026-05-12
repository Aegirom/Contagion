import React from 'react';
import AiEvaluationScore from '../../SubmissionsPage/Components/AiEvaluationScore';

function EvaluationDisplay({ evaluation, activeTab }) {
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
            {[
              "Entropy analysis shows high potential for obfuscation.",
              "API hooking detected in standard kernel libraries.",
              "Unusual network traffic patterns (C2 beaconing)."
            ].map((pattern, i) => (
              <div key={i} className="flex items-start gap-3 text-[10px] font-mono border-l-2 border-toxic pl-4 py-1">
                <span className="text-toxic font-black">[MATCH]</span>
                <span className="text-gray-700">{pattern}</span>
              </div>
            ))}
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
      <section className="bg-white border border-phantom p-6 rounded-sm">
        <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-6">Heuristic Engine Matches</h4>
        <div className="space-y-4">
          {[
            { rule: "HEUR:SUSP_PE_SECTION_NAME", desc: "Non-standard PE section names detected (potential packer).", severity: "Medium" },
            { rule: "HEUR:MALW_PERSIST_REGISTRY", desc: "Attempts to modify 'Run' registry keys for persistence.", severity: "High" },
            { rule: "HEUR:NET_SUSP_PORT_ACTIVITY", desc: "Outbound connections on non-standard ports (C2 behavior).", severity: "High" },
            { rule: "HEUR:EVASION_TIMING_LOOP", desc: "Execution delay detected to bypass sandbox time limits.", severity: "Critical" }
          ].map((h, i) => (
            <div key={i} className="flex items-start gap-4 p-4 border border-phantom hover:bg-gray-50 transition-colors">
              <div className={`w-1 h-10 flex-shrink-0 ${
                h.severity === 'Critical' ? 'bg-red-600' : 
                h.severity === 'High' ? 'bg-red-400' : 'bg-yellow-400'
              }`}></div>
              <div>
                <p className="text-[10px] font-mono font-black text-gray-900 mb-1">{h.rule}</p>
                <p className="text-xs text-gray-600 font-mono mb-2">{h.desc}</p>
                <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 bg-gray-100 border border-phantom rounded-sm">
                  Severity: {h.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-phantom p-6 rounded-sm">
        <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-4">Static Analysis Metadata</h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Compiler/Linker</p>
            <p className="text-xs font-mono text-gray-900">Microsoft Visual C++ 8.0</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">EntryPoint</p>
            <p className="text-xs font-mono text-gray-900">0x004012AC</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Subsystem</p>
            <p className="text-xs font-mono text-gray-900">Windows GUI</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Sections</p>
            <p className="text-xs font-mono text-gray-900">.text, .rdata, .data, .rsrc</p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderMitigation = () => (
    <div className="space-y-8 animate-fade-in">
      <section className="bg-white border border-phantom p-6 rounded-sm">
        <h4 className="text-gray-900 font-bold uppercase tracking-widest text-xs mb-6">Recommended Response Strategy</h4>
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-100">
            <h5 className="text-red-900 font-black uppercase tracking-widest text-[10px] mb-2">Primary Action</h5>
            <p className="text-xs text-red-800 font-mono leading-relaxed">
              Immediate host isolation. The sample shows confirmed C2 beaconing patterns and lateral movement capability. 
              Revoke all active sessions for users associated with infected endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-phantom">
              <h5 className="text-gray-900 font-black uppercase tracking-widest text-[10px] mb-3">Network Defense</h5>
              <ul className="space-y-2">
                {[
                  "Block identified C2 domain infrastructure.",
                  "Enable strict egress filtering on port 443/80.",
                  "Inspect TLS traffic for non-standard certificates."
                ].map((li, i) => (
                  <li key={i} className="text-[10px] font-mono text-gray-600 flex items-start gap-2">
                    <span className="text-toxic">•</span> {li}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border border-phantom">
              <h5 className="text-gray-900 font-black uppercase tracking-widest text-[10px] mb-3">Endpoint Hardening</h5>
              <ul className="space-y-2">
                {[
                  "Disable WScript/CScript execution via GPO.",
                  "Audit 'Run' registry key modifications.",
                  "Deploy updated EDR behavioral signatures."
                ].map((li, i) => (
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
{`rule Neural_Malware_Match_Gen {
    meta:
        description = "Automated YARA rule based on Neural Trace"
        hash = "${evaluation.submissionId}"
    strings:
        $s1 = { 6A 40 68 00 30 00 00 6A 14 8D 45 }
        $s2 = "User-Agent: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)"
    condition:
        uint16(0) == 0x5A4D and all of them
}`}
          </pre>
        </div>
      </section>
    </div>
  );

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
