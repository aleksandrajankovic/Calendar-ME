import { Roboto, Roboto_Condensed} from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

import { BASE_URL, OG_LOCALE, HTML_LANG } from "@/lib/market";
const roboto = Roboto({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  // Koristi ga samo admin panel — bez preload-a na javnoj stranici
  preload: false,
});
const robotoCondensed = Roboto_Condensed({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-condensed",
  // Koristi ga samo admin panel — bez preload-a na javnoj stranici
  preload: false,
});

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Kalendar Promocija | Meridianbet",
  description:
    "Budite u toku sa dnevnim ponudama, otkrijte nove promocije i iskoristite ekskluzivne nagrade uz Meridianbet Kalendar Promocija.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kalendar Promocija | Meridianbet",
    description:
      "Budite u toku sa dnevnim ponudama, otkrijte nove promocije i iskoristite ekskluzivne nagrade uz Meridianbet Kalendar Promocija.",
    url: "/",
    siteName: "Meridianbet",
    images: [
      {
        url: "https://cloud.merbet.com/Preview-image/calendar-universal.png",
        width: 1200,
        height: 630,
        alt: "Kalendar Promocija",
      },
    ],
    locale: OG_LOCALE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalendar Promocija | Meridianbet",
    description:
      "Budite u toku sa dnevnim ponudama, otkrijte nove promocije i iskoristite ekskluzivne nagrade uz Meridianbet Kalendar Promocija.",
    images: ["https://cloud.merbet.com/Preview-image/calendar-universal.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};




export default function RootLayout({ children }) {
  return (
    <html lang={HTML_LANG}>
      <body
        className={`${roboto.variable} ${robotoCondensed.variable} min-h-screen`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{ style: { background: "#fff", color: "#333" } }}
        />
      </body>
    </html>
  );
}
