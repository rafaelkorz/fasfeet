import * as Yup from 'yup';
import { parseISO, format, isBefore } from 'date-fns';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import Queue from '../../lib/Queue';
import OrderMail from '../jobs/OrderMail';

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

    const { prod } = await Order.create(req.body);

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    const recipient = await Recipient.findByPk(recipient_id);

    await Queue.add(OrderMail.key, {
      prod,
      deliveryman,
      recipient
    });

    return res.json(req.body);
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
        'start_date',
        'end_date',
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

  async update(req, res) {
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

    await order.update(req.body);
    return res.status(200).json({ order });
  }

  async withdraw(req, res) {
    const order = await Order.findOne({ where: { id: req.params.id } });

    if (!order) {
      return res.status(400).json({ Error: 'Order ID does not exist!' });
    }

    const schema = Yup.object().shape({
      start_date: Yup.date().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Error: 'Validation fails' });
    }

    const { start_date } = req.body;

    if (isBefore(parseISO(start_date), new Date()) === true) {
      return res.status(400).json({ Error: 'Start date is before today!' });
    }

    const start = format(parseISO(start_date), 'HH:mm')
      .split(':')
      .join('')
      .split('0')
      .join('');

    if (start < 8 || start > 18) {
      return res.status(400).json({ Error: 'You can not start at this hour!' });
    }

    await order.update(req.body);
    return res.status(200).json({ order });
  }

  async delivered(req, res) {
    const order = await Order.findOne({ where: { id: req.params.id } });

    if (!order) {
      return res.status(400).json({ Error: 'Order ID does not exist!' });
    }

    const schema = Yup.object().shape({
      end_date: Yup.date().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Error: 'Validation fails' });
    }

    await order.update(req.body);
    return res.status(200).json({ order });
  }
}

export default new OrderController();
