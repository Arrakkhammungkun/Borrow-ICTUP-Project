// /src/app/create-profile/page.tsx
import { Suspense } from "react";
import CreateProfileContent from "@/components/CreateProfileContent";

export default function CreateProfile() {
  return (
    <Suspense fallback={<div className="text-center p-6">กำลังโหลด...</div>}>
      <CreateProfileContent />
    </Suspense>
  );
}