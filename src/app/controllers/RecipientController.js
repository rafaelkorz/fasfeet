import * as Yup from 'yup';
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
    const recipient = await Recipient.findAll({});
    return res.json(recipient);
  }
}

export default new RecipientController();