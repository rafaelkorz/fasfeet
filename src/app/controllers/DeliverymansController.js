import * as Yup from 'yup';
import Deliverymans from '../models/Deliverymans';

class DeliverymansController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'Validation Deliverymans fails store' });
    }

    const deliverymansExists = await Deliverymans.findOne({
      where: { name: req.body.name }
    });

    if (deliverymansExists) {
      return res.status(400).json({ error: 'Deliverymansyar already exists' });
    }

    const { id, name, email } = await Deliverymans.create(req.body);

    return res.json({
      id,
      name,
      email
    });
  }

  async update(req, res) {
    const deliverymans = await Deliverymans.findByPk(req.params.id);

    if (!deliverymans) {
      return res.status(400).json({ error: 'Deliverymans not exists' });
    }

    const { id, name, email } = await deliverymans.update(req.body);

    return res.json({
      id,
      name,
      email
    });
  }

  async delete(req, res) {
    const deliverymanExists = await Deliverymans.findByPk(req.params.id);

    if (!deliverymanExists) {
      return res.status(400).json({ error: 'Deliveryman not exists' });
    }

    await Deliverymans.destroy({ where: { id: req.params.id } });
    return res.status(200).json({});
  }

  async index(req, res) {
    return res.json(await Deliverymans.findAll({}));
  }
}

export default new DeliverymansController();
