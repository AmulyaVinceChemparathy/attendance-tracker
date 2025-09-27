const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory storage for demo purposes
// In production, use a real database
let users = [];
let classes = [];
let attendance = [];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

exports.handler = async (event, context) => {
  const { httpMethod, path, headers, body } = event;
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = body ? JSON.parse(body) : {};
    const authHeader = headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (path.includes('/login')) {
      const { email, password } = data;
      const user = users.find(u => u.email === email);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const token = generateToken(user);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ token, user: { id: user.id, name: user.name, email: user.email } })
      };
    }

    if (path.includes('/register')) {
      const { name, email, password } = data;
      
      if (users.find(u => u.email === email)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'User already exists' })
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { id: users.length + 1, name, email, password: hashedPassword };
      users.push(user);

      const token = generateToken(user);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ token, user: { id: user.id, name: user.name, email: user.email } })
      };
    }

    if (path.includes('/verify')) {
      if (!token) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'No token provided' })
        };
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Invalid token' })
        };
      }

      const user = users.find(u => u.id === decoded.userId);
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'User not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: { id: user.id, name: user.name, email: user.email } })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Not found' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: error.message })
    };
  }
};

