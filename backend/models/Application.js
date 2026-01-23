const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define(
    'Application',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      studentId: { type: DataTypes.UUID, allowNull: false },
      internshipId: { type: DataTypes.UUID, allowNull: false },
      coverLetter: { type: DataTypes.TEXT },
      cvUrl: { type: DataTypes.STRING(255) },
      status: {
        type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      feedback: { type: DataTypes.TEXT },
      reviewedBy: { type: DataTypes.UUID },
      appliedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      reviewedAt: { type: DataTypes.DATE },
    },
    {
      tableName: 'applications',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['status'] }, { fields: ['student_id'] }],
    }
  );

  return Application;
};

