# Internship Application Letter Templates

This document explains how the internship letter generation system works and how to customize it.

## Overview

The system generates professional internship application letters for students with:
- Program-specific department signatures
- Student information auto-filled
- Optional internship-specific details
- Professional formatting suitable for printing

## Letter Structure

Each letter includes:
1. **Header**: RMU logo and university information
2. **Date**: Current date in formal format
3. **Recipient**: Company/HR Manager details
4. **Subject**: Recommendation for internship placement
5. **Body**: Personalized recommendation letter
6. **Signature**: Department head signature (program-specific)
7. **Footer**: Official university verification information

## Program Signatures

Signatures are configured in `backend/controllers/letterController.js`:

```javascript
const programSignatures = {
  'BSc Marine Engineering': {
    name: 'Dr. [Name]',
    title: 'Head of Department',
    department: 'Marine Engineering',
    signature: '/signatures/marine-engineering.png'
  },
  // ... other programs
};
```

### Customizing Signatures

1. **Update Names and Titles**:
   - Edit `backend/controllers/letterController.js`
   - Update the `programSignatures` object with actual names and titles

2. **Add Signature Images**:
   - Create directory: `backend/public/signatures/`
   - Add signature images (PNG format recommended)
   - Update the `signature` path in the configuration

3. **Add New Programs**:
   - Add new entries to `programSignatures` object
   - Follow the same structure as existing programs

## Letter Generation

### For Students

1. Navigate to `/dashboard/letter`
2. Optionally select an internship (for specific letter)
3. Click "Generate Letter"
4. Review the letter
5. Download as HTML or Print/Save as PDF

### API Endpoints

- `GET /api/letters/generate?internshipId={id}` - Generate letter HTML
- `GET /api/letters/download?internshipId={id}&format=html` - Download letter
- `GET /api/letters/signatures` - Get all signatures (admin only)

## Customization

### Letter Content

Edit `generateLetterHTML()` function in `backend/controllers/letterController.js` to:
- Change letter wording
- Add/remove sections
- Modify formatting
- Update university information

### Styling

The letter uses inline CSS for consistent rendering. Modify the `<style>` section in `generateLetterHTML()` to:
- Change fonts
- Adjust spacing
- Modify colors
- Update layout

### Adding Signature Images

1. Prepare signature images (PNG format, transparent background recommended)
2. Save to `backend/public/signatures/`
3. Update signature paths in `programSignatures`
4. Ensure images are accessible via the public path

## Print/PDF Functionality

The letter is designed to be printed directly from the browser:
- Click "Print / Save as PDF" button
- Browser print dialog opens
- Select "Save as PDF" as destination
- Letter maintains professional formatting

## Example Letter Fields

- Student Name: Auto-filled from user profile
- Student ID: Auto-filled from user profile
- Program: Auto-filled from user profile
- Year of Study: Auto-filled from user profile
- Internship Details: Optional, from selected internship
- Date: Current date
- Signature: Program-specific department head

## Security

- Only authenticated students can generate letters
- Letters include user's own information only
- Admin can view all signature configurations
- Letters are generated on-demand (not stored)

## Future Enhancements

Potential improvements:
- PDF generation server-side (using puppeteer or similar)
- Digital signatures
- Letter templates for different purposes
- Batch letter generation for admin
- Letter history/audit trail
- Email integration to send letters directly
