import * as Yup from 'yup';
import { parseISO, format, isBefore } from 'date-fns';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
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
    const { recipient_id, deliveryman_id, product } = req.body;

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

    await Order.create(req.body);

    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    const recipient = await Recipient.findByPk(recipient_id);

    await Queue.add(OrderMail.key, {
      product,
      deliveryman,
      recipient
    });

    return res.json(req.body);
  }

  async index(req, res) {
    const deliveries = await Order.findAll({
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email', 'avatar_id'],
          include: {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path', 'url']
          }
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'zip_code',
            'number',
            'state',
            'city',
            'complement'
          ]
        }
      ],
      attributes: [
        'id',
        'product',
        'deliveryman_id',
        'recipient_id',
        'canceled_at',
        'start_date',
        'end_date'
      ]
    });
    return res.json(deliveries);
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
