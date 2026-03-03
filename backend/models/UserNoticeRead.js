const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const UserNoticeRead = sequelize.define(
        'UserNoticeRead',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: () => uuidv4(),
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                }
            },
            noticeId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'notices',
                    key: 'id',
                }
            },
            readAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'user_notice_reads',
            underscored: true,
            timestamps: false,
            indexes: [
                {
                    unique: true,
                    fields: ['user_id', 'notice_id'],
                },
            ],
        }
    );

    return UserNoticeRead;
};
