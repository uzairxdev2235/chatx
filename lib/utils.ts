import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: any) {
  if (!timestamp) return ""

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, "h:mm a")
}

export function formatDate(timestamp: any) {
  if (!timestamp) return ""

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, "MMM d, yyyy")
}

export async function uploadImageToImgBB(file: File) {
  const formData = new FormData()
  formData.append("image", file)

  try {
    const response = await fetch("https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    if (data.success) {
      return data.data.url
    } else {
      throw new Error("Failed to upload image")
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

export function getInitials(name: string) {
  if (!name) return ""

  const parts = name.split(" ")
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
