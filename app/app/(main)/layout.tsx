import { Providers } from "@/app/providers";
import { Footer } from "@/components/app/Footer";
import { auth } from "@/lib/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <Providers session={session}>
      <div className="min-h-[50rem]">{children}</div>
      <Footer />
    </Providers>
  );
}
