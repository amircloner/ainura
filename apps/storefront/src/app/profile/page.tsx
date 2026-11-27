import type { Metadata } from "next"
import { ProfilePage } from "@/components/profile/profile-page"

export const metadata: Metadata = {
  title: { absolute: "حساب کاربری | آینورا" },
}

export default function Page() {
  return <ProfilePage section="overview" />
}
