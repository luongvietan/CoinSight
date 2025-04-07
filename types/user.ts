export interface User {
  id: string
  name: string
  email: string
  password?: string // Only included in the mock API, would not be returned from a real API
}

