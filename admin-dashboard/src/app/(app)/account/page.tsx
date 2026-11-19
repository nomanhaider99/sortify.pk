import type { Metadata } from "next";
import Link from "next/link";
import { signOutEverywhereAction } from "@/app/actions/auth";
import { ProfileForm } from "@/components/auth/profile-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requirePagePermission();
  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardTitle>Your profile</CardTitle>
        <CardDescription className="mb-6">
          Role: <Badge tone="accent">{session.roleName}</Badge> · {session.permissions.size}{" "}
          permissions
        </CardDescription>
        <ProfileForm name={session.name} email={session.email} />
      </Card>
      <div className="space-y-6">
        <Card>
          <CardTitle>Password</CardTitle>
          <CardDescription className="mt-1 mb-4">
            Changing it signs you out everywhere.
          </CardDescription>
          <Button asChild variant="secondary" className="w-full">
            <Link href={"/account/password"}>Change password</Link>
          </Button>
        </Card>
        <Card>
          <CardTitle>Sessions</CardTitle>
          <CardDescription className="mt-1 mb-4">
            Sessions end after 2 hours of inactivity or 12 hours in total.
          </CardDescription>
          <form action={signOutEverywhereAction}>
            <Button type="submit" variant="secondary" className="w-full">
              Sign out on all devices
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
