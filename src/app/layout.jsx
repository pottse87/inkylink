
export const metadata = {
  title: "InkyLink",
  description: "Words that move people. Playful. Artsy. Inky.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
