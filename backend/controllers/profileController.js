const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');
const supabase = require('../config/supabase');

async function get(req, res) {
  return res.json({ user: req.user });
}

async function update(req, res) {
  const user = await User.findByPk(req.user.id);
  const allowed = ['firstName', 'lastName', 'phone', 'department', 'program', 'yearOfStudy', 'bio', 'skills'];
  for (const k of allowed) {
    if (req.body[k] !== undefined) user[k] = req.body[k];
  }
  await user.save();
  const safe = user.toJSON();
  delete safe.password;
  return res.json({ message: 'Profile updated', user: safe });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.json({ message: 'Password updated' });
}

async function uploadAvatar(req, res) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.file.path) {
      return res.status(400).json({ message: 'File path not available' });
    }

    // Delete old avatar from Supabase Storage if exists
    if (user.avatar) {
      try {
        // Extract file path from Supabase Storage URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/[path]
        // Or: https://[project].supabase.co/storage/v1/object/sign/avatars/[path]
        let oldFilePath = null;
        const publicMatch = user.avatar.match(/\/avatars\/(.+?)(\?|$)/);
        const signMatch = user.avatar.match(/avatars%2F(.+?)(\?|$)/);
        
        if (publicMatch && publicMatch[1]) {
          oldFilePath = decodeURIComponent(publicMatch[1]);
        } else if (signMatch && signMatch[1]) {
          oldFilePath = decodeURIComponent(signMatch[1]);
        } else {
          // Try to extract from local path format (/uploads/avatars/filename)
          const localMatch = user.avatar.match(/\/uploads\/avatars\/(.+)$/);
          if (localMatch && localMatch[1]) {
            oldFilePath = `avatars/${localMatch[1]}`;
          }
        }
        
        if (oldFilePath) {
          // Remove 'avatars/' prefix if present (it's already in the bucket name)
          if (oldFilePath.startsWith('avatars/')) {
            oldFilePath = oldFilePath.replace('avatars/', '');
          }
          await supabase.storage.from('avatars').remove([oldFilePath]);
        }
      } catch (err) {
        console.error('Error deleting old avatar from storage:', err);
        // Continue even if old avatar deletion fails
      }
    }

    // Read the uploaded file
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileExt = path.extname(req.file.originalname);
    const fileName = `avatar-${req.user.id}-${Date.now()}${fileExt}`;
    const filePath = fileName; // Just the filename, bucket is specified in .from()

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      // Clean up local file
      fs.unlinkSync(req.file.path);
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Clean up local file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error('Error deleting local file:', err);
    }

    // Update only the avatar field
    const updatedUser = await User.update(req.user.id, { avatar: publicUrl });
    
    const safe = updatedUser.toJSON();
    delete safe.password;
    
    return res.json({ 
      message: 'Avatar uploaded successfully', 
      user: safe,
      avatarUrl: publicUrl
    });
  } catch (error) {
    // Clean up local file on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file:', err);
      }
    }
    console.error('Error uploading avatar:', error);
    return res.status(500).json({ 
      message: 'Failed to upload avatar', 
      error: error.message 
    });
  }
}

async function removeAvatar(req, res) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.avatar) {
      try {
        // Extract file path from Supabase Storage URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/[path]
        // Or: https://[project].supabase.co/storage/v1/object/sign/avatars/[path]
        let filePath = null;
        const publicMatch = user.avatar.match(/\/avatars\/(.+?)(\?|$)/);
        const signMatch = user.avatar.match(/avatars%2F(.+?)(\?|$)/);
        
        if (publicMatch && publicMatch[1]) {
          filePath = decodeURIComponent(publicMatch[1]);
        } else if (signMatch && signMatch[1]) {
          filePath = decodeURIComponent(signMatch[1]);
        } else {
          // Try to extract from local path format (/uploads/avatars/filename)
          const localMatch = user.avatar.match(/\/uploads\/avatars\/(.+)$/);
          if (localMatch && localMatch[1]) {
            filePath = `avatars/${localMatch[1]}`;
          }
        }
        
        if (filePath) {
          // Remove 'avatars/' prefix if present (it's already in the bucket name)
          if (filePath.startsWith('avatars/')) {
            filePath = filePath.replace('avatars/', '');
          }
          await supabase.storage.from('avatars').remove([filePath]);
        }
      } catch (err) {
        console.error('Error deleting avatar file from storage:', err);
        // Continue even if file deletion fails
      }
    }

    // Update only the avatar field
    const updatedUser = await User.update(req.user.id, { avatar: null });
    
    const safe = updatedUser.toJSON();
    delete safe.password;
    
    return res.json({ 
      message: 'Avatar removed successfully', 
      user: safe 
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    return res.status(500).json({ 
      message: 'Failed to remove avatar', 
      error: error.message 
    });
  }
}

// Get user preferences
async function getPreferences(req, res) {
  try {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no preferences exist, create default ones
    if (!data) {
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert({ user_id: req.user.id })
        .select()
        .single();

      if (insertError) throw insertError;
      return res.json({ preferences: mapPreferencesFromSupabase(newPrefs) });
    }

    res.json({ preferences: mapPreferencesFromSupabase(data) });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ 
      message: 'Failed to fetch preferences', 
      error: error.message 
    });
  }
}

// Update user preferences
async function updatePreferences(req, res) {
  try {
    const supabase = require('../config/supabase');
    const updates = mapPreferencesToSupabase(req.body);

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let result;
    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({ ...updates, user_id: req.user.id })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ 
      message: 'Preferences updated successfully',
      preferences: mapPreferencesFromSupabase(result)
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ 
      message: 'Failed to update preferences', 
      error: error.message 
    });
  }
}

// Helper functions to map preferences
function mapPreferencesFromSupabase(row) {
  return {
    id: row.id,
    userId: row.user_id,
    // Notification preferences
    emailNotifications: row.email_notifications ?? true,
    pushNotifications: row.push_notifications ?? false,
    applicationUpdates: row.application_updates ?? true,
    newInternships: row.new_internships ?? true,
    deadlineReminders: row.deadline_reminders ?? true,
    letterRequestUpdates: row.letter_request_updates ?? true,
    evaluationUpdates: row.evaluation_updates ?? true,
    // General preferences
    theme: row.theme ?? 'light',
    language: row.language ?? 'en',
    timezone: row.timezone ?? 'GMT',
    // Privacy settings
    profileVisibility: row.profile_visibility ?? 'public',
    showEmail: row.show_email ?? false,
    showPhone: row.show_phone ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPreferencesToSupabase(prefs) {
  const mapped = {};
  if (prefs.emailNotifications !== undefined) mapped.email_notifications = prefs.emailNotifications;
  if (prefs.pushNotifications !== undefined) mapped.push_notifications = prefs.pushNotifications;
  if (prefs.applicationUpdates !== undefined) mapped.application_updates = prefs.applicationUpdates;
  if (prefs.newInternships !== undefined) mapped.new_internships = prefs.newInternships;
  if (prefs.deadlineReminders !== undefined) mapped.deadline_reminders = prefs.deadlineReminders;
  if (prefs.letterRequestUpdates !== undefined) mapped.letter_request_updates = prefs.letterRequestUpdates;
  if (prefs.evaluationUpdates !== undefined) mapped.evaluation_updates = prefs.evaluationUpdates;
  if (prefs.theme !== undefined) mapped.theme = prefs.theme;
  if (prefs.language !== undefined) mapped.language = prefs.language;
  if (prefs.timezone !== undefined) mapped.timezone = prefs.timezone;
  if (prefs.profileVisibility !== undefined) mapped.profile_visibility = prefs.profileVisibility;
  if (prefs.showEmail !== undefined) mapped.show_email = prefs.showEmail;
  if (prefs.showPhone !== undefined) mapped.show_phone = prefs.showPhone;
  return mapped;
}

module.exports = { 
  get, 
  update, 
  changePassword, 
  uploadAvatar, 
  removeAvatar,
  getPreferences,
  updatePreferences,
};

