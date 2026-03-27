import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

interface AuditData {
  overall_score: number
  verdict: string
  scores: {
    clarity: number
    hook_strength: number
    trust_architecture: number
    desire_building: number
    action_clarity: number
    objection_handling: number
  }
  top_fixes: Array<{
    issue: string
    fix: string
    impact: string
  }>
  full_analysis: string
}

export default function PaidReport() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [auditData, setAuditData] = useState<AuditData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided')
      setLoading(false)
      return
    }

    verifyAndLoadReport()
  }, [sessionId])

  const verifyAndLoadReport = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-purchase`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        }
      )

      const data = await response.json()

      if (!data.valid) {
        setError('Invalid or unpaid session')
        setLoading(false)
        return
      }

      setAuditData(data.purchase.audit_data)
      setLoading(false)
    } catch (err) {
      console.error('Verification failed:', err)
      setError('Failed to load report')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your full diagnosis...</p>
        </div>
      </div>
    )
  }

  if (error || !auditData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error || 'Report not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  const scoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 5) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Full Conversion Diagnosis
          </h1>
          <p className="text-gray-600">Complete analysis of your landing page</p>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Overall Score
              </h2>
              <p className="text-gray-600">{auditData.verdict}</p>
            </div>
            <div className="text-6xl font-bold text-teal-600">
              {auditData.overall_score}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Score Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(auditData.scores).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className={`text-2xl font-bold ${scoreColor(value)}`}>
                  {value}/10
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Fixes */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Priority Fixes</h2>
          <div className="space-y-6">
            {auditData.top_fixes.map((fix, idx) => (
              <div key={idx} className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {idx + 1}. {fix.issue}
                </h3>
                <p className="text-gray-700 mb-2">{fix.fix}</p>
                <span className="text-sm text-teal-600 font-medium">
                  Impact: {fix.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Full Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Complete Analysis
          </h2>
          <div className="prose prose-lg max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans">
              {auditData.full_analysis}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
