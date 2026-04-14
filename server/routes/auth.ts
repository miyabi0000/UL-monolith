import { Router } from 'express';
import { sendError, sendSuccess } from './shared/httpResponse.js';

const router = Router();

// Simple in-memory user store (replace with database)
const users = [
  {
    id: 'demo-user-1',
    email: 'demo@example.com',
    password: 'DemoPass123!', // In production, this would be hashed
    createdAt: new Date().toISOString()
  }
];

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return sendError(res, 'Email and password are required', undefined, 400);
    }

    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return sendError(res, 'Invalid credentials', undefined, 401);
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    
    return sendSuccess(res, {
      success: true,
      data: {
        user: userData,
        // In production, return JWT token here
        token: 'mock-jwt-token'
      },
      message: 'Login successful'
    });
  } catch (error) {
    return sendError(res, 'Login failed', error);
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    // In production, invalidate JWT token or session
    return sendSuccess(res, {
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    return sendError(res, 'Logout failed', error);
  }
});

// Register endpoint (for future use)
router.post('/register', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return sendError(res, 'Email and password are required', undefined, 400);
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return sendError(res, 'User already exists', undefined, 409);
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In production, hash the password
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Return user data (excluding password)
    const { password: _, ...userData } = newUser;
    
    return sendSuccess(res, {
      success: true,
      data: {
        user: userData,
        token: 'mock-jwt-token'
      },
      message: 'Registration successful'
    }, 201);
  } catch (error) {
    return sendError(res, 'Registration failed', error);
  }
});

export default router;
