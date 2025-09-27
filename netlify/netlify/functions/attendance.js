const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory storage
let attendance = [];
let classes = [];

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

    if (httpMethod === 'GET' && path.includes('/stats')) {
      // Calculate attendance stats
      const userAttendance = attendance.filter(a => a.userId === userId);
      const stats = userAttendance.reduce((acc, record) => {
        const key = record.classId;
        if (!acc[key]) {
          acc[key] = { classId: key, subject: record.subject, present: 0, total: 0 };
        }
        acc[key].total++;
        if (record.attended) acc[key].present++;
        return acc;
      }, {});

      const statsArray = Object.values(stats).map(stat => ({
        ...stat,
        attendanceRate: stat.total > 0 ? stat.present / stat.total : 0
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ stats: statsArray })
      };
    }

    if (httpMethod === 'GET') {
      const userAttendance = attendance.filter(a => a.userId === userId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ attendance: userAttendance })
      };
    }

    if (httpMethod === 'POST') {
      const data = JSON.parse(body);
      const newRecord = {
        id: attendance.length + 1,
        userId,
        ...data,
        createdAt: new Date().toISOString()
      };
      attendance.push(newRecord);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ record: newRecord })
      };
    }

    if (httpMethod === 'PUT') {
      const recordId = parseInt(path.split('/').pop());
      const data = JSON.parse(body);
      
      const recordIndex = attendance.findIndex(a => a.id === recordId && a.userId === userId);
      if (recordIndex === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Record not found' })
        };
      }

      attendance[recordIndex] = { ...attendance[recordIndex], ...data };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ record: attendance[recordIndex] })
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

