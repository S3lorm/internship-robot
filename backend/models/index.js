const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize, DataTypes);
const Internship = require('./Internship')(sequelize, DataTypes);
const Application = require('./Application')(sequelize, DataTypes);
const Notice = require('./Notice')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);

// Associations
User.hasMany(Internship, { foreignKey: 'postedBy', as: 'postedInternships' });
Internship.belongsTo(User, { foreignKey: 'postedBy', as: 'poster' });

User.hasMany(Application, { foreignKey: 'studentId', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

Internship.hasMany(Application, { foreignKey: 'internshipId' });
Application.belongsTo(Internship, { foreignKey: 'internshipId' });

User.hasMany(Notice, { foreignKey: 'createdBy', as: 'notices' });
Notice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Application.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

module.exports = {
  sequelize,
  User,
  Internship,
  Application,
  Notice,
  Notification,
};

