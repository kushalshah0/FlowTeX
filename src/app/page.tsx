import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decodeSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("auth_token");

  if (auth && decodeSession(auth.value)) {
    redirect("/dashboard");
  }

  redirect("/login");
}
