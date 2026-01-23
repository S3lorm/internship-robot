const fs = require('fs');
const path = require('path');
const multer = require('multer');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const baseUploadPath = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, '..', 'uploads');

const cvsDir = path.join(baseUploadPath, 'cvs');
const avatarsDir = path.join(baseUploadPath, 'avatars');
ensureDir(cvsDir);
ensureDir(avatarsDir);

const cvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, cvsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cv-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

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

const uploadCv = multer({ storage: cvStorage, fileFilter: cvFileFilter, limits: { fileSize: maxFileSize } });
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: maxFileSize },
});

module.exports = { uploadCv, uploadAvatar, baseUploadPath, cvsDir, avatarsDir };

