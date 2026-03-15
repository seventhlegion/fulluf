"use client";

import { useLoginMutation } from "@/lib/api/queries";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Spinner } from "@workspace/ui/components/spinner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuth();
  const loginMutation = useLoginMutation({
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.username);
      router.replace("/chat");
    },
  });

  const { ready } = useAuth();

  useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace("/chat");
    }
  }, [ready, isAuthenticated, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement)
      ?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      ?.value;
    if (username && password) {
      loginMutation.mutate({ username, password });
    }
  }

  if (!ready || isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image src="/sheep.png" alt="Fulluf" width={40} height={40} />
            <div className="flex flex-col">
              <CardTitle className="text-2xl font-bold">Fulluf</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter the shared credentials to join the room
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Fulluf"
                  required
                  disabled={loginMutation.isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={loginMutation.isPending}
                />
              </Field>
              {loginMutation.isError && (
                <FieldError>{loginMutation.error?.message ?? "Login failed"}</FieldError>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  "Enter"
                )}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
