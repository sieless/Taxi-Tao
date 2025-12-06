/**
 * Image Upload Utility for Cloudinary
 * Handles uploading driver profile photos and car images
 */

// Firebase Storage implementation
// const CLOUDINARY_UPLOAD_URL = ... (removed)
// const CLOUDINARY_UPLOAD_PRESET = ... (removed)

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Crops an image file to square (1:1 aspect ratio)
 * @param file - The image file to crop
 * @returns Promise<File> - The cropped image as a new File
 */
export async function cropImageToSquare(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Calculate square size (use smaller dimension)
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        
        // Calculate crop offsets to center the image
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        
        // Draw cropped image
        ctx.drawImage(
          img,
          offsetX, offsetY, size, size, // Source
          0, 0, size, size // Destination
        );
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            // Create new File from blob
            const croppedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            resolve(croppedFile);
          },
          file.type,
          0.95 // Quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads an image to Firebase Storage
 * @param file - The image file to upload
 * @param folder - Optional folder name in Storage
 * @returns Upload result with URL
 */
export async function uploadImage(
  file: File,
  folder: string = "uploads"
): Promise<UploadResult> {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const uniqueName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const storagePath = `${folder}/${uniqueName}`;
    
    // Create a reference
    const storageRef = ref(storage, storagePath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      publicId: storagePath,
      width: 0, // Not available directly from Firebase Storage without extra logic
      height: 0,
    };
  } catch (error: any) {
    console.error("Error uploading image:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Validates image file before upload
 */
export function validateImageFile(file: File): void {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }

  if (file.size > maxSize) {
    throw new Error('File is too large. Maximum size is 5MB.');
  }
}

/**
 * Uploads a driver profile photo
 */
export async function uploadProfilePhoto(file: File): Promise<UploadResult> {
  validateImageFile(file);
  return uploadImage(file, 'taxi-drivers');
}

/**
 * Uploads a car photo (crops to square first)
 */
export async function uploadCarPhoto(file: File): Promise<UploadResult> {
  validateImageFile(file);
  
  // Crop to square for consistent card display
  const croppedFile = await cropImageToSquare(file);
  
  return uploadImage(croppedFile, 'taxi-cars');
}
