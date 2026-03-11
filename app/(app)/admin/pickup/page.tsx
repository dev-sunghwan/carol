import { redirect } from "next/navigation";

export default function PickupRedirect() {
  const today = new Date().toISOString().slice(0, 10);
  redirect(`/admin/pickup/${today}`);
}
