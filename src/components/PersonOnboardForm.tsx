'use client';

import React, { useState } from 'react';
import { UserCircle, Upload, Briefcase, Building, Users, Loader2 } from 'lucide-react';

interface PersonOnboardFormProps {
  code: string;
  onSuccess: () => void;
}

export default function PersonOnboardForm({ code, onSuccess }: PersonOnboardFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    department: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Formato non supportato. Usa JPG, PNG o WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File troppo grande. Massimo 5MB');
      return;
    }

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
  };

  // Upload image to Vercel Blob
  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', selectedFile);

      const res = await fetch('/api/people/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (res.ok) {
        const { imagePath } = await res.json();
        return imagePath;
      } else {
        const error = await res.json();
        alert(error.error || 'Errore upload immagine');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Errore durante l\'upload dell\'immagine');
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name
    if (!formData.name || formData.name.trim().length < 2) {
      setError('Nome richiesto (minimo 2 caratteri)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload image if present
      let imageUrl: string | null = null;
      if (selectedFile) {
        imageUrl = await uploadImage();
        // If upload fails, we continue without image
      }

      // Step 2: Onboard person
      const response = await fetch('/api/qr/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          name: formData.name,
          role: formData.role || null,
          company: formData.company || null,
          department: formData.department || null,
          image: imageUrl
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success - trigger page reload to show card
        onSuccess();
      } else {
        setError(data.error || 'Errore durante la registrazione');
      }
    } catch (error) {
      console.error('Onboard error:', error);
      setError('Errore di connessione. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pt-8 pb-6 px-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Registrazione Badge
            </h1>
            <p className="text-blue-100 text-sm">
              Badge: <span className="font-mono font-bold">{code}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto (opzionale)
              </label>
              <div className="flex flex-col items-center gap-4">
                {/* Preview */}
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-20 h-20 text-gray-400" />
                  )}
                </div>

                {/* Upload Button */}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {selectedFile ? 'Cambia foto' : 'Carica foto'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 text-center">
                  JPG, PNG o WebP - Max 5MB
                </p>
              </div>
            </div>

            {/* Name - Required */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mario Rossi"
                maxLength={255}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Ruolo
              </label>
              <input
                id="role"
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Developer"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Azienda
              </label>
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="ACME Inc"
                maxLength={255}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Dipartimento
              </label>
              <input
                id="department"
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="IT"
                maxLength={255}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrazione in corso...
                </>
              ) : (
                'Completa Registrazione'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              * Campo obbligatorio
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
