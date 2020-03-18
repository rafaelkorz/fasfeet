import * as Yup from 'yup';
import { Op } from 'sequelize';
import Recipient from '../models/Recipient';

class RecipientController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string(),
      complement: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      zip_code: Yup.string()
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'Validation Recipient fails store' });
    }

    const recipientExists = await Recipient.findOne({
      where: { name: req.body.name }
    });

    if (recipientExists) {
      return res.status(400).json({ error: 'Recipient already exists' });
    }

    const { id, name, street, provider } = await Recipient.create(req.body);

    return res.json({
      id,
      name,
      street,
      provider
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string(),
      complement: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      zip_code: Yup.string()
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'Validation Recipient fails update' });
    }
    const { name } = req.body;

    const recipient = await Recipient.findByPk(req.params.id);

    if (name && name === recipient.name) {
      const recipientExists = await Recipient.findOne({
        where: { name: recipient.name }
      });

      if (recipientExists) {
        return res.status(400).json({ error: 'Recipient already exists' });
      }
    }

    const { id, provider } = await recipient.update(req.body);

    return res.json({
      id,
      name,
      provider
    });
  }

  async index(req, res) {
    const { id } = req.params;
    const { page, q } = req.query;
    const atualPage = page || '1';
    const name = q || '';

    if (id) {
      const recipient = await Recipient.findByPk(id);
      return res.json(recipient);
    }

    const recipients = await Recipient.findAndCountAll({
      where: { name: { [Op.iLike]: `%${name}%` } },
      order: [['name', 'ASC']],
      limit: 5,
      offset: (atualPage - 1) * 5
    });
    return res.json(recipients);
  }
}

export default new RecipientController();
