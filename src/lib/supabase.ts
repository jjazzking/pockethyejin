import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** 환경 변수가 빠졌을 때 보여줄 메시지. 설정이 정상이면 null. */
export const supabaseConfigError =
  url && key
    ? null
    : "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 환경 변수가 없습니다. .env.example을 참고하세요.";

let client: SupabaseClient | null = null;

/** 브라우저용 Supabase 클라이언트. 로그인 세션은 브라우저에 저장돼 기기마다 한 번만 로그인하면 된다. */
export function getSupabase(): SupabaseClient {
  if (supabaseConfigError) throw new Error(supabaseConfigError);
  client ??= createClient(url!, key!, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}
