import jwt from 'jsonwebtoken';

const secretKey: string = 'your_secret_key'; // Reemplaza esto con tu clave secreta

interface Payload {
  id: string;
  email: string;
  role: string;
}

const generateToken = (id: string, email: string, role: string): string => {
  const payload: Payload = {
    id: id,
    email: email,
    role: role,
  };

  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

export const generateTeacherToken = (): string => {
  return generateToken('teacher1', 'teacher@example.com', 'teacher');
};

export const generateStudentToken = (): string => {
  return generateToken('student1', 'student@example.com', 'student');
};
