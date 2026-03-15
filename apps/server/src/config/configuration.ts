export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  database: {
    path: process.env.DATABASE_PATH ?? './data/chat.db',
  },
  auth: {
    username: process.env.CHAT_ROOM_USERNAME ?? 'chat',
    password: process.env.CHAT_ROOM_PASSWORD ?? 'room123',
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY ?? 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // 32 bytes for AES-256
    ivLength: 16,
    saltLength: 16,
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/ogg',
      'audio/wav',
      'audio/webm',
      'application/pdf',
      'text/csv',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/vnd.rar',
    ],
  },
});
