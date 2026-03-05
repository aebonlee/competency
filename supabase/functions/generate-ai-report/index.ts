import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPETENCY_LABELS = [
  "비판적/분석적 사고",
  "창의력",
  "복합적 의사소통",
  "협업능력",
  "디지털 리터러시",
  "감성지능(공감능력)",
  "복합문제 해결능력",
  "마음의 습관",
];

function buildPrompt(
  scores: number[],
  userContext: { age?: string; position?: string; gender?: string } | null
): string {
  // 순위 계산
  const ranked = scores
    .map((score, i) => ({ score, index: i, name: COMPETENCY_LABELS[i] }))
    .sort((a, b) => b.score - a.score);

  const top3 = ranked.slice(0, 3).map((r) => `${r.name}(${r.score}점)`).join(", ");
  const bottom3 = ranked.slice(5).map((r) => `${r.name}(${r.score}점)`).join(", ");
  const allScores = ranked.map((r, i) => `${i + 1}위: ${r.name} — ${r.score}점`).join("\n");

  let userInfo = "";
  if (userContext) {
    const parts: string[] = [];
    if (userContext.age) parts.push(`연령대: ${userContext.age}`);
    if (userContext.position) parts.push(`직무/직위: ${userContext.position}`);
    if (userContext.gender) parts.push(`성별: ${userContext.gender === "M" ? "남성" : "여성"}`);
    if (parts.length > 0) userInfo = `\n\n대상자 정보: ${parts.join(", ")}`;
  }

  return `당신은 4차 산업혁명 시대 핵심역량 분석 전문 커리어 컨설턴트입니다.

아래 8대 핵심역량 검사 결과를 분석하여 맞춤형 보고서를 작성해 주세요.

## 검사 결과 (순위별)
${allScores}

상위 3개 역량: ${top3}
하위 3개 역량: ${bottom3}${userInfo}

## 보고서 작성 지침
다음 4개 섹션을 Markdown 형식으로 작성해 주세요. 총 분량은 2,000~3,000자입니다.

### 출력 형식

## 종합 해설
(8대 역량 점수 패턴을 종합적으로 해석. 강점과 성장 가능성 중심으로 긍정적이고 격려적인 톤으로 작성)

## 역량별 개발 방향
(8개 역량 각각에 대해 현재 수준 해석 + 구체적인 개발 방법 1~2가지씩 제시. 각 역량을 "### 역량명" 소제목으로 구분)

## 직무 추천
(상위 역량 조합에 기반한 적합 직무 3~5개 추천. 각 직무별 역량과의 연관성 설명)

## 실천 계획
(주간/월간 단위의 구체적이고 실행 가능한 역량 개발 계획 5~7개 항목)

중요: 격려적이고 건설적인 톤을 유지하세요. 약점보다는 성장 가능성에 초점을 맞추세요.`;
}

async function callClaude(prompt: string, apiKey: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Claude API error: ${res.status} — ${errBody}`);
  }

  const data = await res.json();
  return {
    content: data.content[0]?.text || "",
    model: data.model || "claude-sonnet-4-5-20250514",
    prompt_tokens: data.usage?.input_tokens || 0,
    completion_tokens: data.usage?.output_tokens || 0,
  };
}

async function callOpenAI(prompt: string, apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenAI API error: ${res.status} — ${errBody}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0]?.message?.content || "",
    model: data.model || "gpt-4o-mini",
    prompt_tokens: data.usage?.prompt_tokens || 0,
    completion_tokens: data.usage?.completion_tokens || 0,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { evalId, provider, forceRegenerate } = await req.json();

    if (!evalId || !provider) {
      return new Response(
        JSON.stringify({ error: "evalId and provider are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (provider !== "claude" && provider !== "openai") {
      return new Response(
        JSON.stringify({ error: "provider must be 'claude' or 'openai'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // JWT에서 사용자 인증
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 사용자 인증 확인 (anon key로 JWT 검증)
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 캐시 확인 — 기존 보고서가 있으면 즉시 반환
    if (!forceRegenerate) {
      const { data: cached } = await supabase
        .from("ai_reports")
        .select("*")
        .eq("eval_id", evalId)
        .eq("provider", provider)
        .single();

      if (cached) {
        return new Response(
          JSON.stringify({ ...cached, cached: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 결과 점수 조회
    const { data: result, error: resultError } = await supabase
      .from("results")
      .select("*")
      .eq("eval_id", evalId)
      .single();

    if (resultError || !result) {
      return new Response(
        JSON.stringify({ error: "Result not found for this evaluation" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // eval_list에서 user_id 확인 (본인 검사인지 검증)
    const { data: evalData } = await supabase
      .from("eval_list")
      .select("user_id")
      .eq("id", evalId)
      .single();

    if (!evalData || evalData.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Not authorized to access this evaluation" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("age, position, gender")
      .eq("id", user.id)
      .single();

    const scores = [
      result.point1, result.point2, result.point3, result.point4,
      result.point5, result.point6, result.point7, result.point8,
    ];

    const userContext = profile
      ? { age: profile.age, position: profile.position, gender: profile.gender }
      : null;

    const prompt = buildPrompt(scores, userContext);

    // AI API 호출
    const startTime = Date.now();
    let aiResult;

    if (provider === "claude") {
      const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      aiResult = await callClaude(prompt, apiKey);
    } else {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      aiResult = await callOpenAI(prompt, apiKey);
    }

    const generationTime = Date.now() - startTime;

    // DB에 upsert
    const reportData = {
      eval_id: evalId,
      user_id: user.id,
      provider,
      model: aiResult.model,
      report_content: aiResult.content,
      scores_snapshot: Object.fromEntries(
        COMPETENCY_LABELS.map((label, i) => [label, scores[i]])
      ),
      user_context: userContext,
      prompt_tokens: aiResult.prompt_tokens,
      completion_tokens: aiResult.completion_tokens,
      generation_time_ms: generationTime,
    };

    const { data: saved, error: saveError } = await supabase
      .from("ai_reports")
      .upsert(reportData, { onConflict: "eval_id,provider" })
      .select()
      .single();

    if (saveError) {
      // 저장 실패해도 보고서 내용은 반환
      return new Response(
        JSON.stringify({ ...reportData, id: null, cached: false, save_error: saveError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ...saved, cached: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
