// Login stranica ne treba da se pojavljuje u Google rezultatima
export const metadata = {
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }) {
  return children;
}
