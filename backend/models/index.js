// Export Supabase models instead of Sequelize models
const { 
  User, 
  Internship, 
  Application, 
  Notice, 
  Notification, 
  LetterRequest,
  Evaluation,
  Logbook,
  Report,
  AdministrativeAction,
  supabase 
} = require('./supabase');

// For backward compatibility, export sequelize as null
// Some code might check for sequelize, but we're using Supabase now
const sequelize = null;

module.exports = {
  sequelize,
  User,
  Internship,
  Application,
  Notice,
  Notification,
  LetterRequest,
  Evaluation,
  Logbook,
  Report,
  AdministrativeAction,
  supabase,
};

