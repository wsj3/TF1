import './globals.css';

export const metadata = {
  title: 'Therapists Friend',
  description: 'A comprehensive practice management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
