export interface PillarScore {
  score: number;
  issue: string;
  fix: string;
}

export interface TopFix {
  priority: number;
  issue: string;
  impact: string;
  fix: string;
}

export interface AuditResult {
  overall_score: number;
  verdict: "Healthy" | "Needs Attention" | "Critical";
  scores: {
    clarity: PillarScore;
    hook: PillarScore;
    trust: PillarScore;
    desire: PillarScore;
    action: PillarScore;
    objections: PillarScore;
  };
  top_3_fixes: TopFix[];
}
