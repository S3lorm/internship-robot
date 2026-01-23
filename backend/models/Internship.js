const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Internship = sequelize.define(
    'Internship',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      company: { type: DataTypes.STRING(255), allowNull: false },
      location: { type: DataTypes.STRING(255), allowNull: false },
      type: {
        type: DataTypes.ENUM('full-time', 'part-time', 'remote'),
        defaultValue: 'full-time',
      },
      duration: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      requirements: { type: DataTypes.JSON },
      responsibilities: { type: DataTypes.JSON },
      stipend: { type: DataTypes.STRING(100) },
      deadline: { type: DataTypes.DATE, allowNull: false },
      slots: { type: DataTypes.INTEGER, defaultValue: 1 },
      status: {
        type: DataTypes.ENUM('open', 'closed', 'filled'),
        defaultValue: 'open',
      },
      postedBy: { type: DataTypes.UUID, allowNull: false },
      postedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'internships',
      underscored: true,
      timestamps: true,
      createdAt: false,
      updatedAt: 'updated_at',
      indexes: [{ fields: ['status'] }, { fields: ['deadline'] }],
    }
  );

  return Internship;
};

