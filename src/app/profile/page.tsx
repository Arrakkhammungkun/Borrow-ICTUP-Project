"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import jwt from 'jsonwebtoken';

export default function Profile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [formData, setFormData] = useState({
    up_id: '',
    email: '',
    first_name: '',
    last_name: '',
    title: '',
    prefix: '',
    jobTitle: '',
    mobilePhone: '',
    officeLocation: '',
    displayName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setError('No token available.');
        setLoading(false);
        return;
      }

      try {
        const decodedToken = jwt.decode(token) as { up_id: string; email: string };
        const response = await fetch(`/api/auth/user?up_id=${decodedToken.up_id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setFormData(result.user);
        } else {
          setError(result.error);
        }
      } catch (err:unknown) {
        if(err instanceof Error){
          setError('Failed to load user data.');
        }else{
          setError('Failed to load user data.');
        }
        
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('No token available.');
      return;
    }

    try {
      const response = await fetch('/api/auth/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        router.push(`/AddItem?token=${encodeURIComponent(token)}`);
      } else {
        setError(result.error);
      }
    } catch (err:unknown) {
      if(err instanceof Error){
        setError('Failed to update profile.');
      }else{
        setError('Failed to update profile.');
      }
      
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">UP ID</label>
          <input type="text" name="up_id" value={formData.up_id} onChange={handleChange} className="border p-2 w-full" readOnly />
        </div>
        <div>
          <label className="block">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block">First Name</label>
          <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block">Last Name</label>
          <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block">Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block">Prefix</label>
          <input type="text" name="prefix" value={formData.prefix} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block">Job Title</label>
          <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block">Mobile Phone</label>
          <input type="text" name="mobilePhone" value={formData.mobilePhone} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block">Office Location</label>
          <input type="text" name="officeLocation" value={formData.officeLocation} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block">Display Name</label>
          <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} className="border p-2 w-full" />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Update Profile</button>
      </form>
    </div>
  );
}