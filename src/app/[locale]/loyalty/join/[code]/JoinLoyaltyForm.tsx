"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";

interface JoinFormProps {
  ar: boolean;
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
}

export function JoinLoyaltyForm({ ar, action, error }: JoinFormProps) {
  const [phone, setPhone] = useState("");

  return (
    <form action={action} className="mt-6 grid gap-4">
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {error === "PHONE_REQUIRED"
            ? ar
              ? "رقم الهاتف مطلوب."
              : "Phone number is required."
            : ar
              ? "البيانات غير صالحة. حاول مرة أخرى."
              : "Invalid input. Please try again."}
        </div>
      ) : null}

      <Input name="fullName" required placeholder={ar ? "الاسم الكامل" : "Full name"} />
      <div className="grid gap-4 sm:grid-cols-2">
        <PhoneInput name="phone" value={phone} onChange={setPhone} placeholder="91234567" required />
        <Input name="email" placeholder={ar ? "البريد (اختياري)" : "Email (optional)"} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary">
          {ar ? "انضم الآن" : "Join now"}
        </Button>
      </div>
    </form>
  );
}
