"use client"; // ต้องอยู่บรรทัดแรก

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// กำหนด interface สำหรับ initialData
interface ProfileData {
  up_id: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  prefix?: string;
  jobTitle?: string;
  mobilePhone?: string;
  officeLocation?: string;
  displayName?: string;
}

export default function ProfileForm({ initialData, token }: { initialData: ProfileData; token: string }) {
  console.log("ProfileForm props:", { initialData, token });
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: initialData.first_name || "",
    last_name: initialData.last_name || "",
    title: initialData.title || "",
    prefix: initialData.prefix || "",
    jobTitle: initialData.jobTitle || "",
    mobilePhone: initialData.mobilePhone || "",
    officeLocation: initialData.officeLocation || "",
    displayName: initialData.displayName || "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form with token:", token);
    try {
      if (!token) {
        setError("User not authenticated");
        return;
      }

      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, up_id: initialData.up_id }),
      });
      const data = await response.json();
      console.log("API response for PUT:", data);
      if (data.success) {
        Swal.fire({
          title: "อัปเดตข้อมูลเสร็จสิ้น!",
          icon: "success",
          draggable: true,
        }).then(() => {
          router.push("/AddItem");
        });
      } else {
        setError(data.error);
      }
    } catch (err: unknown) {
      // เปลี่ยน err: any เป็น err: unknown และจัดการ type
      if (err instanceof Error) {
        console.error("Error submitting form:", err);
        setError(`Failed to update profile: ${err.message}`);
      } else {
        console.error("Error submitting form: Unexpected error", err);
        setError("Failed to update profile: Unknown error");
      }
    }
  };

  if (error) return <div className="text-center p-8">Error: {error}</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block">First Name</label>
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Last Name</label>
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Mobile Phone</label>
        <input
          type="text"
          name="mobilePhone"
          value={formData.mobilePhone}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Prefix</label>
        <input
          type="text"
          name="prefix"
          value={formData.prefix}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Job Title</label>
        <input
          type="text"
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Office Location</label>
        <input
          type="text"
          name="officeLocation"
          value={formData.officeLocation}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block">Display Name</label>
        <input
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
}