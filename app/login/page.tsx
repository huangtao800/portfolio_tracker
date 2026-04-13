import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/auth";
import LoginButton from "./LoginButton";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Portfolio Roaster</h1>
          <p className="text-gray-400 text-sm">Sign in to view your portfolio</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 space-y-6">
          <LoginButton />
        </div>
      </div>
    </main>
  );
}
