import * as Yup from 'yup';
import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  isAfter,
  isBefore
} from 'date-fns';
import { Op } from 'sequelize';
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
        },
        {
          model: File,
          as: 'signature',
          attributes: ['name', 'path', 'url']
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
    const { deliverymanId, orderId } = req.params;

    const deliveryman = await Deliveryman.findByPk(deliverymanId);
    if (!deliveryman) {
      return res.status(400).json({ Error: 'Deliveryman does not exist!' });
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        deliveryman_id: deliverymanId,
        start_date: null,
        canceled_at: null
      }
    });
    if (!order) {
      return res.status(400).json({ Error: 'Order does not exist!' });
    }

    const date = new Date();

    const startDelivery = setSeconds(setMinutes(setHours(date, 8), 0), 0);
    const endDelivery = setSeconds(setMinutes(setHours(date, 18), 0), 0);

    if (!(isAfter(date, startDelivery) && isBefore(date, endDelivery))) {
      return res
        .status(400)
        .json({ Error: 'You can start between 08:00 and 18:00' });
    }

    const { count: countAttempts } = await Order.findAndCountAll({
      where: {
        deliveryman_id: deliverymanId,
        canceled_at: null,
        start_date: { [Op.between]: [startOfDay(date), endOfDay(date)] }
      }
    });

    if (countAttempts >= 5) {
      return res
        .status(400)
        .json({ Error: 'You have reached your 5 attempts' });
    }

    const deliveryStart = await order.update({ start_date: new Date() });

    return res.json(deliveryStart);
  }

  async delivered(req, res) {
    const order = await Order.findOne({ where: { id: req.params.id } });

    if (!order) {
      return res.status(400).json({ Error: 'Order ID does not exist!' });
    }

    const { originalname: name, filename: path } = req.file;

    const newFile = await File.create({
      name,
      path
    });

    const finishedDelivery = await order.update({
      signatures_id: newFile.id,
      end_date: new Date()
    });

    return res.json(finishedDelivery);
  }
}

export default new OrderController();
