export const metadata = {
  title: 'RadicAI Ad Agent API',
  description: 'API server for generating campaign plans from ad briefs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

