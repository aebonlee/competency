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

    // 1. PortOne V2 API로 결제 상태 확인
    const portoneSecret = Deno.env.get("PORTONE_API_SECRET");
    if (!portoneSecret) {
      return new Response(
        JSON.stringify({ error: "PortOne API secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const portoneRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${portoneSecret}` },
    });

    if (!portoneRes.ok) {
      const errBody = await portoneRes.text();
      return new Response(
        JSON.stringify({ error: "Failed to verify payment with PortOne", detail: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payment = await portoneRes.json();

    if (payment.status !== "PAID") {
      return new Response(
        JSON.stringify({ error: "Payment not completed", status: payment.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Supabase에서 purchase 정보 확인
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

    // 3. 금액 일치 검증
    const paidAmount = payment.amount?.total ?? payment.totalAmount;
    if (paidAmount !== purchase.amount) {
      return new Response(
        JSON.stringify({ error: "Amount mismatch", expected: purchase.amount, actual: paidAmount }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. purchase 상태 업데이트
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
