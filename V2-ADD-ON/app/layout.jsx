import "./globals.css";

export const metadata = {
  title: "Voice Studio AI",
  description: "Voice Studio AI — Text-to-Voice dan Voice-to-Voice",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
