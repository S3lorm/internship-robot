const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Notice = sequelize.define(
    'Notice',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
      },
      targetAudience: {
        type: DataTypes.ENUM('all', 'students', 'admins'),
        defaultValue: 'all',
      },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      expiresAt: { type: DataTypes.DATE },
      createdBy: { type: DataTypes.UUID, allowNull: false },
    },
    {
      tableName: 'notices',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['is_active'] }, { fields: ['priority'] }],
    }
  );

  return Notice;
};

