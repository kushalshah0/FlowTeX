import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("auth_token");

  if (auth?.value === "flowtex_demo") {
    redirect("/dashboard");
  }

  redirect("/login");
}
