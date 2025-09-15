import { Router } from 'express';

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
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    
    res.json({
      success: true,
      data: {
        user: userData,
        // In production, return JWT token here
        token: 'mock-jwt-token'
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    // In production, invalidate JWT token or session
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register endpoint (for future use)
router.post('/register', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
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
    
    res.status(201).json({
      success: true,
      data: {
        user: userData,
        token: 'mock-jwt-token'
      },
      message: 'Registration successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;