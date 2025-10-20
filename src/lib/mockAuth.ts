// Mock authentication service using localStorage
export interface User {
  id: string;
  email: string;
  name: string;
}

export const mockAuth = {
  signup: (email: string, password: string, name: string): User => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find((u: User & { password: string }) => u.email === email)) {
      throw new Error('User already exists');
    }

    const user: User & { password: string } = {
      id: crypto.randomUUID(),
      email,
      password,
      name,
    };

    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  login: (email: string, password: string): User => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: User & { password: string }) => 
      u.email === email && u.password === password
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  },

  logout: () => {
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('currentUser');
  },
};
