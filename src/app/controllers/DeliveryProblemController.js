import * as Yup from 'yup';

import DeliveryProblem from '../models/DeliveryProblem';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';
import Order from '../models/Order';
import CancellationOrderMail from '../jobs/CancellationOrderMail';
import Queue from '../../lib/Queue';

class DeliveryProblemController {
  async show(req, res) {
    const problems = await DeliveryProblem.findAll({
      where: { delivery_id: req.params.orderId },
      attributes: ['delivery_id', 'description'],
      include: {
        model: Order,
        as: 'order_problem',
        attributes: ['id', 'product', 'recipient_id', 'deliveryman_id']
      }
    });

    if (problems === null) {
      return res
        .status(404)
        .json({ Message: 'it does not exist problem to that order!' });
    }

    return res.json(problems);
  }

  async index(req, res) {
    const { id } = req.params;
    const { page } = req.query;
    const atualPage = page || '1';

    if (id) {
      const deliveryProblem = await DeliveryProblem.findAndCountAll({
        where: {
          delivery_id: id
        },
        attributes: ['id', 'description']
      });

      return res.json(deliveryProblem);
    }

    const deliveryProblems = await DeliveryProblem.findAndCountAll({
      include: [
        {
          model: Order,
          as: 'order_problem',
          attributes: ['id', 'product', 'start_date', 'end_date', 'canceled_at']
        }
      ],
      order: [['delivery_id', 'ASC']],
      limit: 5,
      offset: (atualPage - 1) * 5,
      attributes: ['id', 'description']
    });
    return res.json(deliveryProblems);
  }

  async store(req, res) {
    const isOrder = await Order.findOne({
      where: { id: req.params.orderId }
    });

    if (!isOrder) {
      return res.status(400).json({ Error: 'ID does not exist!' });
    }

    const schema = Yup.object().shape({
      description: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ Error: 'Validation fails!' });
    }
    if (req.body.delivery_id && req.body.delivery_id !== req.params.orderId) {
      return res.status(400).json({ Error: 'You can not do it!' });
    }

    const newProblem = await DeliveryProblem.create({
      delivery_id: req.params.orderId,
      description: req.body.description
    });

    return res.json({
      id: newProblem.id,
      delivery_id: newProblem.delivery_id,
      description: newProblem.description
    });
  }

  async delete(req, res) {
    const problems = await DeliveryProblem.findOne({
      where: { id: req.params.id }
    });

    if (problems === null) {
      return res.status(404).json({
        Message: 'it does not exist problem to that order for cancel!'
      });
    }

    const order = await Order.findOne({
      where: { id: problems.delivery_id }
    });

    if (order === null) {
      return res.status(404).json({
        Message: 'Order not found!'
      });
    }

    const deliveryman = await Deliveryman.findByPk(order.deliveryman_id);
    const recipient = await Recipient.findByPk(order.recipient_id);

    await Queue.add(CancellationOrderMail.key, {
      order,
      deliveryman,
      recipient
    });

    const deliveryCancel = await order.update({ canceled_at: new Date() });

    await DeliveryProblem.destroy({ where: { id: req.params.id } });

    return res.status(200).json({ deliveryCancel });
  }
}

export default new DeliveryProblemController();
