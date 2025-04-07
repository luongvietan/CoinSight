// Mock authentication functions
// In a real app, these would connect to your backend API

import type { User } from "@/types/user"

// Simulate API delay
const apiDelay = () => new Promise((resolve) => setTimeout(resolve, 1000))

// Mock user storage
const users: User[] = [
  {
    id: "1",
    name: "Demo User",
    email: "demo@example.com",
    password: "password123", // In a real app, this would be hashed
  },
]

// Mock current user
let currentUser: User | null = null

export async function loginUser(email: string, password: string): Promise<User> {
  await apiDelay()

  const user = users.find((u) => u.email === email && u.password === password)

  if (!user) {
    throw new Error("Invalid email or password")
  }

  // Store user in localStorage (in a real app, you'd store a token)
  localStorage.setItem("user", JSON.stringify({ id: user.id, name: user.name, email: user.email }))
  currentUser = user

  return user
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  await apiDelay()

  // Check if user already exists
  if (users.some((u) => u.email === email)) {
    throw new Error("User with this email already exists")
  }

  // Create new user
  const newUser: User = {
    id: (users.length + 1).toString(),
    name,
    email,
    password, // In a real app, this would be hashed
  }

  users.push(newUser)

  return newUser
}

export async function resetPassword(email: string): Promise<void> {
  await apiDelay()

  // Check if user exists
  const user = users.find((u) => u.email === email)

  if (!user) {
    throw new Error("User with this email does not exist")
  }

  // In a real app, you would send an email with a reset link
  console.log(`Password reset link sent to ${email}`)
}

export async function logoutUser(): Promise<void> {
  await apiDelay()

  // Remove user from localStorage
  localStorage.removeItem("user")
  currentUser = null
}

export async function getCurrentUser(): Promise<User | null> {
  await apiDelay()

  // Try to get user from localStorage
  const userJson = localStorage.getItem("user")

  if (!userJson) {
    return null
  }

  try {
    return JSON.parse(userJson) as User
  } catch (error) {
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

