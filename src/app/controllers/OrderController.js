import * as Yup from 'yup';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

class OrderController {
  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      product: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Error: 'Validation fails' });
    }
    const { recipient_id, deliveryman_id } = req.body;

    const isRecipient = await Recipient.findOne({
      where: { id: recipient_id }
    });

    if (!isRecipient) {
      return res.status(400).json({ Error: 'Recipient ID does not exist!' });
    }

    const isDeliveryman = await Deliveryman.findOne({
      where: { id: deliveryman_id }
    });

    if (!isDeliveryman) {
      return res.status(400).json({ Error: 'Deliveryman ID does not exist!' });
    }

    const { id, product } = await Order.create(req.body);
    return res.json({ id, product, recipient_id, deliveryman_id });
  }

  async index(req, res) {
    const { page = 1 } = req.query;
    const orders = await Order.findAll({
      order: ['created_at'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: [
        'id',
        'product',
        'recipient_id',
        'deliveryman_id',
        'signatures_id'
      ]
    });

    return res.json(orders);
  }

  async delete(req, res) {
    const isId = await Order.findOne({ where: { id: req.params.id } });

    if (!isId) {
      return res.status(400).json({ Error: 'ID does not exist!' });
    }

    await Order.destroy({ where: { id: req.params.id } });

    return res.status(200).json({});
  }

  async put(req, res) {
    const order = await Order.findOne({ where: { id: req.params.id } });

    if (!order) {
      return res.status(400).json({ Error: 'Order ID does not exist!' });
    }

    const schema = Yup.object().shape({
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      product: Yup.string()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Error: 'Validation fails' });
    }

    try {
      await order.update(req.body);
      return res.status(200).json({ order });
    } catch (err) {
      return res.status(500).json({ Error: 'Anything wrong happend...' });
    }
  }
}

export default new OrderController();
