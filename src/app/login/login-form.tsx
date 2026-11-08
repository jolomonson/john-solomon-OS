"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, verifyCode, type LoginState } from "./actions";

const URL_ERRORS: Record<string, string> = {
  not_allowed: "This email can't use this app.",
  link_invalid: "That sign-in link is invalid or expired. Request a new one.",
  bootstrap_failed: "Signed in, but setup failed. Try again.",
};

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/today";
  const urlError = URL_ERRORS[params.get("error") ?? ""];

  const [emailState, emailAction, sending] = useActionState<LoginState, FormData>(sendMagicLink, { step: "email" });
  const [codeState, codeAction, verifying] = useActionState<LoginState, FormData>(verifyCode, { step: "email" });

  // After a code is requested, stay on the code step unless verification bounced back to email.
  const showCode = emailState.step === "code" && !(codeState.step === "email" && codeState.error);
  const email = emailState.step === "code" ? emailState.email : (emailState.email ?? "");

  if (showCode) {
    return (
      <form action={codeAction} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {emailState.step === "code" && emailState.info} Sent to <span className="font-medium text-foreground">{email}</span>.
        </p>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="token">Code</Label>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            autoFocus
            required
            className="font-mono tracking-widest"
          />
        </div>
        {codeState.error && <p className="text-sm text-destructive">{codeState.error}</p>}
        <Button type="submit" className="w-full" disabled={verifying}>
          {verifying && <Loader2 className="animate-spin" />} Verify code
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => window.location.reload()}>
          Use a different email
        </Button>
      </form>
    );
  }

  const error = emailState.error ?? (codeState.step === "email" ? codeState.error : undefined) ?? urlError;

  return (
    <form action={emailAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={email} required autoFocus />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={sending}>
        {sending && <Loader2 className="animate-spin" />} Email me a sign-in link
      </Button>
    </form>
  );
}
