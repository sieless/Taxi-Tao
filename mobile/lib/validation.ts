// Validation utilities for form inputs

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { valid: false, error: "Email is required" };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  
  return { valid: true };
};

export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  // Kenyan phone number format: +254XXXXXXXXX or 07XXXXXXXX or 01XXXXXXXX
  const phoneRegex = /^(\+254|0)[17]\d{8}$/;
  
  if (!phone) {
    return { valid: false, error: "Phone number is required" };
  }
  
  const cleaned = phone.replace(/\s+/g, "");
  
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: "Please enter a valid Kenyan phone number" };
  }
  
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }
  
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  
  return { valid: true };
};

export const validateName = (name: string): { valid: boolean; error?: string } => {
  if (!name) {
    return { valid: false, error: "Name is required" };
  }
  
  if (name.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return { valid: false, error: "Name can only contain letters and spaces" };
  }
  
  return { valid: true };
};

export const normalizePhone = (phone: string): string => {
  // Convert 07XX or 01XX to +254 format
  const cleaned = phone.replace(/\s+/g, "");
  
  if (cleaned.startsWith("0")) {
    return `+254${cleaned.substring(1)}`;
  }
  
  if (cleaned.startsWith("+254")) {
    return cleaned;
  }
  
  if (cleaned.startsWith("254")) {
    return `+${cleaned}`;
  }
  
  return cleaned;
};
