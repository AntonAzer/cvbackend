export default {
  async fetch(req, env, ctx) {
    return new Response(JSON.stringify({ status: "Backend شغال ✅" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
