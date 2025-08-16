'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { getImageUrl } from '@/app/utils/imageUtils';

export default function ProfileImageUpload({ setProfileImage }: { setProfileImage: (url: string) => void }) {
  const { user, updateUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      };
      const prefix = user?.role === 'admin' ? 'admin' : 'auth';
      const response = await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/${prefix}/profile/image`, formData, config);
      updateUser(response.data.user);
      setProfileImage(response.data.user.profileImage);
      setSuccess('Profile image uploaded successfully!');
      setFile(null); // Clear the file input
      (e.target as HTMLFormElement).reset(); // Reset the form to clear the file input visually
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to upload image');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4">Upload Profile Image</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="profile-image" className="block text-sm font-medium text-gray-700">Choose Image</label>
          <input
            type="file"
            id="profile-image"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>
      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      {success && <p className="mt-3 text-green-600 text-sm">{success}</p>}

      {user?.profileImage && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Current Profile Image:</h3>
          <img
            src={getImageUrl(user.profileImage)}
            alt="Profile"
            width="150"
            height="150"
            className="rounded-full object-cover border-2 border-gray-300"
          />
        </div>
      )}
    </div>
  )};