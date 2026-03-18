import { Providers } from "@/app/providers";
import { Footer } from "@/components/app/Footer";
import { auth } from "@/lib/auth";
import { isOfficialOnlyDomain } from "@/lib/domain";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const officialOnly = await isOfficialOnlyDomain();
  return (
    <Providers session={session} officialOnly={officialOnly}>
      <div className="min-h-[50rem]">{children}</div>
      <Footer />
    </Providers>
  );
}
