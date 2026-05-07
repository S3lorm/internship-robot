// Export Supabase models
const { supabase } = require('./supabase');
const { Op } = require('./utils');

const User = require('./User');
const Internship = require('./Internship');
const Application = require('./Application');
const Notice = require('./Notice');
const Notification = require('./Notification');
const LetterRequest = require('./LetterRequest');
const InternshipPlacement = require('./InternshipPlacement');
const EvaluationToken = require('./EvaluationToken');
const EmailLog = require('./EmailLog');
const Evaluation = require('./Evaluation');
const Logbook = require('./Logbook');
const WeeklyLogbook = require('./WeeklyLogbook');
const Report = require('./Report');
const AdministrativeAction = require('./AdministrativeAction');
const PlacementActionLog = require('./PlacementActionLog');
const StaffSignature = require('./StaffSignature');

// For backward compatibility, export sequelize as null
// Some code might check for sequelize, but we're using Supabase now
const sequelize = null;

module.exports = {
  sequelize,
  Op,
  User,
  Internship,
  Application,
  Notice,
  Notification,
  LetterRequest,
  InternshipPlacement,
  EvaluationToken,
  EmailLog,
  Evaluation,
  Logbook,
  WeeklyLogbook,
  Report,
  AdministrativeAction,
  PlacementActionLog,
  StaffSignature,
  supabase,
};
