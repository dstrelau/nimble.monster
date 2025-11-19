export default async function ObrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen w-full">{children}</div>;
}
