"use client";

import { useState, useTransition } from "react";
import { User, Mail, Lock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
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
import { updateProfile } from "@/actions/auth";
import { toast } from "sonner";

type Props = {
  user: { name: string; email: string };
};

export function AccountSection({ user }: Props) {
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isChangingName, startNameTransition] = useTransition();

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, startPasswordTransition] = useTransition();

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

  return (
    <section>
      <h2 className="text-xs font-medium text-muted-foreground mb-2">
        アカウント
      </h2>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* 表示名 */}
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
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>表示名の変更</DialogTitle>
                <DialogDescription>新しい表示名を入力してください</DialogDescription>
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
                {nameError && <p className="text-sm text-destructive">{nameError}</p>}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNameDialogOpen(false)}
                  disabled={isChangingName}
                >
                  キャンセル
                </Button>
                <LoadingButton
                  onClick={handleNameChange}
                  loading={isChangingName}
                  loadingText="変更中..."
                  disabled={!newName.trim()}
                >
                  変更する
                </LoadingButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* メールアドレス */}
        <div className="flex items-center p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">メールアドレス</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        </div>

        {/* パスワード */}
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
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
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
                <LoadingButton
                  onClick={handlePasswordChange}
                  loading={isChangingPassword}
                  loadingText="変更中..."
                  disabled={!currentPassword || !newPassword}
                >
                  変更する
                </LoadingButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
