import {
    Sequelize,
    DataTypes
} from 'sequelize';

export interface UserAttributes {
    firstName ? : string;
    lastName ? : string;
    email ? : string;

}

export interface UserInstance {
    id: number;
    createdAt: Date;
    updatedAt: Date;

    firstName: string;
    lastName: string;
    email: string;

}

export = (sequelize: Sequelize, DataTypes: DataTypes) => {
    var User = sequelize.define('User', {
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING
    });

    User.associate = function(models) {
        // associations can be defined here
    };

    return User;
};
