export const config = {
  runtime: 'edge',
};

export default async function handler() {
  const supabaseUrl = 'https://drnfvuorvdipxxmtdsbt.supabase.co';
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'GET',
    headers: {
      apikey: process.env.SUPABASE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
    },
  });

  return new Response(JSON.stringify({ status: response.status }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
