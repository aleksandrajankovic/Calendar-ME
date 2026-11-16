import { redirect } from "next/navigation";

// Spojeno u jednu stranicu sa tabovima (Calendar Styling)
export default function Redirect() {
  redirect("/admin/calendar-style");
}
