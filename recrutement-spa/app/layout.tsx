import type { Metadata } from "next";


import "./globals.css"; // Laissez l'import de votre CSS



export const metadata: Metadata = {
  // Mettez à jour le titre pour votre projet
  title: "Candidature Sunshine Spa & Beauty", 
  description: "Formulaire de recrutement Next.js et Vercel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      
      <body> 
        {children}
      </body>
    </html>
  );
}