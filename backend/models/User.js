const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      firstName: { type: DataTypes.STRING(100), allowNull: false },
      lastName: { type: DataTypes.STRING(100), allowNull: false },
      studentId: { type: DataTypes.STRING(50), unique: true },
      phone: { type: DataTypes.STRING(20) },
      role: {
        type: DataTypes.ENUM('student', 'admin'),
        defaultValue: 'student',
      },
      department: { type: DataTypes.STRING(100) },
      program: { type: DataTypes.STRING(100) },
      yearOfStudy: { type: DataTypes.INTEGER },
      avatar: { type: DataTypes.STRING(255) },
      bio: { type: DataTypes.TEXT },
      skills: { type: DataTypes.JSON },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
      emailVerificationToken: { type: DataTypes.STRING(255) },
      emailVerificationExpires: { type: DataTypes.DATE },
      passwordResetToken: { type: DataTypes.STRING(255) },
      passwordResetExpires: { type: DataTypes.DATE },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['email'] },
        { fields: ['role'] },
        { fields: ['student_id'] },
      ],
    }
  );

  return User;
};

