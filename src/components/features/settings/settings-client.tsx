"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { User, Mail, Lock, LogOut, Sun, Moon, Monitor, Edit, HelpCircle, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateProfile, logout } from "@/actions/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
  { value: "system", label: "システム", icon: Monitor },
] as const;

interface SettingsClientProps {
  user: {
    name: string;
    email: string;
  };
  version: string;
}

export function SettingsClient({ user, version }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();

  // Display name dialog state
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isChangingName, startNameTransition] = useTransition();

  // Password dialog state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, startPasswordTransition] = useTransition();

  // Logout state
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const handleNameChange = () => {
    setNameError(null);
    startNameTransition(async () => {
      const formData = new FormData();
      formData.set("name", newName);
      const result = await updateProfile({}, formData);
      if (result.success) {
        toast.success("表示名を変更しました");
        setIsNameDialogOpen(false);
      } else {
        setNameError(result.error ?? "エラーが発生しました");
      }
    });
  };

  const handlePasswordChange = () => {
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("新しいパスワードは6文字以上で入力してください");
      return;
    }

    startPasswordTransition(async () => {
      const formData = new FormData();
      formData.set("name", user.name);
      formData.set("currentPassword", currentPassword);
      formData.set("newPassword", newPassword);
      const result = await updateProfile({}, formData);
      if (result.success) {
        toast.success("パスワードを変更しました");
        setCurrentPassword("");
        setNewPassword("");
        setIsPasswordDialogOpen(false);
      } else {
        setPasswordError(result.error ?? "エラーが発生しました");
      }
    });
  };

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logout();
    });
  };

  return (
    <div className="flex-1 bg-background">
      <main className="px-4 pt-4 pb-20 md:pb-4 space-y-4">
        {/* Account Section */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2">
            アカウント
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Display Name Row */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">表示名</div>
                  <div className="text-sm text-muted-foreground">{user.name}</div>
                </div>
              </div>
              <Dialog
                open={isNameDialogOpen}
                onOpenChange={(open) => {
                  setIsNameDialogOpen(open);
                  if (!open) {
                    setNewName(user.name);
                    setNameError(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>表示名の変更</DialogTitle>
                    <DialogDescription>
                      新しい表示名を入力してください
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">表示名</Label>
                      <Input
                        id="new-name"
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        disabled={isChangingName}
                      />
                    </div>
                    {nameError && (
                      <p className="text-sm text-destructive">{nameError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsNameDialogOpen(false)}
                      disabled={isChangingName}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleNameChange}
                      disabled={isChangingName || !newName.trim()}
                    >
                      {isChangingName ? "変更中..." : "変更する"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Email Row */}
            <div className="flex items-center p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">メールアドレス</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Password Row */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">パスワード</div>
                  <div className="text-sm text-muted-foreground">••••••••</div>
                </div>
              </div>
              <Dialog
                open={isPasswordDialogOpen}
                onOpenChange={(open) => {
                  setIsPasswordDialogOpen(open);
                  if (!open) {
                    setCurrentPassword("");
                    setNewPassword("");
                    setPasswordError(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>パスワードの変更</DialogTitle>
                    <DialogDescription>
                      現在のパスワードと新しいパスワードを入力してください
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">現在のパスワード</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isChangingPassword}
                        autoComplete="current-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">新しいパスワード</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isChangingPassword}
                        autoComplete="new-password"
                      />
                    </div>
                    {passwordError && (
                      <p className="text-sm text-destructive">{passwordError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                      disabled={isChangingPassword}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={
                        isChangingPassword || !currentPassword || !newPassword
                      }
                    >
                      {isChangingPassword ? "変更中..." : "変更する"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2">
            外観
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-4">
              <div className="text-sm font-medium mb-3">テーマ</div>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                      theme === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Other Section */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-2">
            その他
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Link
              href="/help"
              className="w-full flex items-center justify-between gap-3 p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">ヘルプ</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors disabled:opacity-50 border-t border-border"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {isLoggingOut ? "ログアウト中..." : "ログアウト"}
              </span>
            </button>
          </div>
        </section>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pb-2">
          バージョン {version}
        </p>
      </main>
    </div>
  );
}
