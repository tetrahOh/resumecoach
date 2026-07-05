import "./globals.css";

export const metadata = {
  title: "ResumeCoach — Decide who you're being for this role",
  description:
    "Paste a job description and your resume. ResumeCoach tells you which professional identity to lead with, and writes the resume to match.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-parchment text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
