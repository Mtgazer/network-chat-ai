
// CSS imports are handled by Next.js at build time.
// @ts-expect-error No TypeScript declarations are needed for this stylesheet.
import './ui/global.css';

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
