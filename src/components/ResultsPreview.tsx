import { useAudit } from "@/contexts/AuditContext";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const ResultsPreview = () => {
  const { result, url, userEmail } = useAudit();

  if (!result) return null;

  const pillars = [
    { pillar: "Clarity", score: result.scores?.clarity?.score || 0, fullMark: 10 },
    { pillar: "Hook", score: result.scores?.hook?.score || 0, fullMark: 10 },
    { pillar: "Trust", score: result.scores?.trust?.score || 0, fullMark: 10 },
    { pillar: "Desire", score: result.scores?.desire?.score || 0, fullMark: 10 },
    { pillar: "Action", score: result.scores?.action?.score || 0, fullMark: 10 },
    { pillar: "Objections", score: result.scores?.objections?.score || 0, fullMark: 10 },
  ];

  const handleUpgrade = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          url: url,
          auditResult: result,
        }),
      }
    );
    const data = await response.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <div className="text-5xl font-bold text-primary">{result.overall_score}</div>
          <div className="text-sm text-gray-400">Overall Score</div>
        </div>
        <div className="bg-gray-800 px-4 py-2 rounded-full">
          <span className="font-medium">{result.verdict}</span>
        </div>
      </div>

      <div className="w-full h-[340px] md:h-[420px] mb-6 px-4 md:px-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={pillars}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="pillar" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 10]} tick={{ fill: "#9ca3af" }} />
            <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {Object.entries(result.scores || {}).map(([key, value]: [string, any]) => (
          <div key={key} className="border border-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="capitalize font-semibold text-lg">{key}</span>
              <span className="text-2xl font-bold text-primary">{value.score}/10</span>
            </div>
            <div className="text-sm text-gray-400 mb-2">{value.issue}</div>
            <div className="text-sm">
              <span className="font-medium">Fix:</span> {value.fix}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">Top 3 Fixes</h3>
        <div className="space-y-4">
          {result.top_3_fixes?.map((fix: any) => (
            <div key={fix.priority} className="border-l-4 border-primary pl-4">
              <div className="font-semibold text-lg">
                {fix.priority}. {fix.issue}
              </div>
              <div className="text-sm text-gray-400">Impact: {fix.impact}</div>
              <div className="text-sm mt-1">{fix.fix}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleUpgrade}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
      >
        Get Full Diagnosis £149 →
      </button>
    </div>
  );
};

export default ResultsPreview;
