import { notFound } from "next/navigation"
import { ProfilePage } from "@/components/profile/profile-page"
import { isProfileSection, PROFILE_NAV_ITEMS } from "@/lib/profile"

type Props = { params: Promise<{ section: string }> }

export async function generateMetadata({ params }: Props) {
  const { section } = await params
  const item = PROFILE_NAV_ITEMS.find(({ id }) => id === section)
  return item ? { title: { absolute: `${item.label} | آینورا` } } : {}
}

export default async function Page({ params }: Props) {
  const { section } = await params
  if (!isProfileSection(section)) notFound()
  return <ProfilePage section={section} />
}
