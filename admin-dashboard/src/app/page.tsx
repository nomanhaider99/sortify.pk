import { BRAND } from "@repo/shared";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

// Foundation preview of the admin design tokens; replaced by sign-in + dashboard in M7.
export default function AdminHome() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">{BRAND.name} Admin</p>
        <ThemeToggle />
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Staff access only.</CardDescription>
          </div>
          <Badge tone="accent">Secure</Badge>
        </CardHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" disabled />
          </div>
          <Button className="w-full" disabled>
            Continue
          </Button>
        </div>
      </Card>
    </main>
  );
}
