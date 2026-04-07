"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type RegisterState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">アカウント作成</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state.error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">表示名</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="山田 太郎"
              autoComplete="name"
              required
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="mail@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="8文字以上"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "登録中..." : "アカウントを作成"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          すでにアカウントをお持ちの方は{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            ログイン
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
