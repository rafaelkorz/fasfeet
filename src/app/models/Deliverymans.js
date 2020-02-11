import Sequelize, { Model } from 'sequelize';

class Deliverymans extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING
      },
      {
        sequelize
      }
    );
    return this;
  }
}

export default Deliverymans;
