import { useAudit } from "@/contexts/AuditContext";

export default function ResultsPreview() {
  const { result, url, userEmail } = useAudit();

  const handleFullDiagnosis = async () => {
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
    if (data.url) {
      window.location.href = data.url;
    }
  };

  if (!result) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Your Free Audit Results</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 border rounded">
          <div className="text-4xl font-bold">{result.overall_score}</div>
          <div className="text-gray-600">Overall Score</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-xl font-semibold">{result.verdict}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {Object.entries(result.scores || {}).map(([key, value]: [string, any]) => (
          <div key={key} className="border rounded p-4">
            <div className="capitalize font-semibold">{key}</div>
            <div className="text-2xl font-bold">{value.score}/10</div>
            <div className="text-sm text-gray-600 mt-2">{value.issue}</div>
            <div className="text-sm mt-1">
              <span className="font-semibold">Fix:</span> {value.fix}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-xl font-bold mb-4">Top 3 Fixes</h3>
        {result.top_3_fixes?.map((fix: any) => (
          <div key={fix.priority} className="mb-4">
            <div className="font-semibold">{fix.priority}. {fix.issue}</div>
            <div className="text-sm text-gray-600">Impact: {fix.impact}</div>
            <div className="text-sm">{fix.fix}</div>
          </div>
        ))}
      </div>

      <button
        onClick={handleFullDiagnosis}
        className="w-full bg-green-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-green-700 transition"
      >
        Get Full Diagnosis £149 →
      </button>
    </div>
  );
}
