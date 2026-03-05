import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { paymentId, purchaseId } = await req.json();

    if (!paymentId || !purchaseId) {
      return new Response(
        JSON.stringify({ error: "paymentId and purchaseId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. 아임포트 V1 REST API — 액세스 토큰 발급
    const impKey = Deno.env.get("IMP_REST_KEY");
    const impSecret = Deno.env.get("IMP_REST_SECRET");
    if (!impKey || !impSecret) {
      return new Response(
        JSON.stringify({ error: "IMP_REST_KEY / IMP_REST_SECRET not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imp_key: impKey, imp_secret: impSecret }),
    });

    const tokenBody = await tokenRes.json();
    if (tokenBody.code !== 0 || !tokenBody.response?.access_token) {
      return new Response(
        JSON.stringify({ error: "Failed to get iamport access token", detail: tokenBody.message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenBody.response.access_token;

    // 2. 결제 정보 조회 (imp_uid 기반)
    const paymentRes = await fetch(`https://api.iamport.kr/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const paymentBody = await paymentRes.json();
    if (paymentBody.code !== 0 || !paymentBody.response) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch payment info", detail: paymentBody.message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payment = paymentBody.response;

    // 3. 결제 상태 확인
    if (payment.status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed", status: payment.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Supabase에서 purchase 정보 확인
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: purchase, error: fetchError } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", purchaseId)
      .single();

    if (fetchError || !purchase) {
      return new Response(
        JSON.stringify({ error: "Purchase not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. 금액 일치 검증
    if (payment.amount !== purchase.amount) {
      return new Response(
        JSON.stringify({ error: "Amount mismatch", expected: purchase.amount, actual: payment.amount }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. purchase 상태 업데이트
    const { error: updateError } = await supabase
      .from("purchases")
      .update({
        status: "paid",
        payment_id: paymentId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", purchaseId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update purchase", detail: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, purchaseId, paymentId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
