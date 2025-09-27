const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory storage
let classes = [];
let users = [];

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

exports.handler = async (event, context) => {
  const { httpMethod, path, headers, body } = event;
  
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
    const authHeader = headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

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

    const userId = decoded.userId;

    if (httpMethod === 'GET') {
      const userClasses = classes.filter(c => c.userId === userId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ classes: userClasses })
      };
    }

    if (httpMethod === 'POST') {
      const data = JSON.parse(body);
      const newClass = {
        id: classes.length + 1,
        userId,
        ...data,
        createdAt: new Date().toISOString()
      };
      classes.push(newClass);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ class: newClass })
      };
    }

    if (httpMethod === 'PUT') {
      const classId = parseInt(path.split('/').pop());
      const data = JSON.parse(body);
      
      const classIndex = classes.findIndex(c => c.id === classId && c.userId === userId);
      if (classIndex === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Class not found' })
        };
      }

      classes[classIndex] = { ...classes[classIndex], ...data };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ class: classes[classIndex] })
      };
    }

    if (httpMethod === 'DELETE') {
      const classId = parseInt(path.split('/').pop());
      
      const classIndex = classes.findIndex(c => c.id === classId && c.userId === userId);
      if (classIndex === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Class not found' })
        };
      }

      classes.splice(classIndex, 1);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Class deleted' })
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


