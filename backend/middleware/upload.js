const multer = require('multer');

// Store files in memory as Buffers instead of writing them to the local disk
const storage = multer.memoryStorage();

const cvFileFilter = (_req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF and Word documents are allowed'), false);
};

const avatarFileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG/PNG/WEBP images are allowed'), false);
};

const maxFileSize = process.env.MAX_FILE_SIZE ? Number(process.env.MAX_FILE_SIZE) : 5 * 1024 * 1024;

const uploadCv = multer({ storage, fileFilter: cvFileFilter, limits: { fileSize: maxFileSize } });
const uploadAvatar = multer({
  storage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: maxFileSize },
});

module.exports = { uploadCv, uploadAvatar };

