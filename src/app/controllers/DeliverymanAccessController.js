import { Op } from 'sequelize';

import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

class DeliverymanAccessController {
  async index(req, res) {
    const deliveryman = await Deliveryman.findOne({
      where: { id: req.params.id }
    });

    if (!deliveryman) {
      return res.status(401).json({ Error: 'Deliveryman does not exist!' });
    }

    const { page = 1 } = req.query;
    const order = await Order.findAll({
      where: {
        deliveryman_id: req.params.id,
        end_date: null,
        canceled_at: null
      },
      limit: 20,
      offset: (page - 1) * 20,
      attributes: [
        'id',
        'product',
        'start_date',
        'end_date',
        'signatures_id',
        'deliveryman_id',
        'recipient_id'
      ],
      include: {
        model: Recipient,
        as: 'recipient',
        attributes: [
          'name',
          'street',
          'number',
          'complement',
          'city',
          'state',
          'zip_code'
        ]
      }
    });

    return res.json(order);
  }

  async deliveries(req, res) {
    const isDeliveryman = await Deliveryman.findOne({
      where: { id: req.params.deliverymanId }
    });

    if (!isDeliveryman) {
      return res.status(401).json({ Error: 'Deliveryman does not exist!' });
    }

    const order = await Order.findAll({
      where: {
        deliveryman_id: req.params.deliverymanId,
        end_date: {
          [Op.not]: null
        },
        canceled_at: null
      },
      attributes: [
        'id',
        'product',
        'start_date',
        'end_date',
        'signatures_id',
        'deliveryman_id',
        'recipient_id'
      ],
      include: {
        model: Recipient,
        as: 'recipient',
        attributes: [
          'name',
          'street',
          'number',
          'complement',
          'city',
          'state',
          'zip_code'
        ]
      }
    });

    return res.json(order);
  }
}

export default new DeliverymanAccessController();
