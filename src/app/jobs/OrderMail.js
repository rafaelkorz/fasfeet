import Mail from '../../lib/Mail';

class OrderMail {
  get key() {
    return 'OrderMail';
  }

  async handle({ data }) {
    const { product, deliveryman, recipient } = data;

    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: `Detalhes da entrega`,
      template: 'newOrder',
      context: {
        prod: product,
        deliveryman: deliveryman.name,
        recipientName: recipient.name,
        recipientStreet: recipient.street,
        recipientNumber: recipient.number,
        recipientZipCode: recipient.zip_code,
        recipientCity: recipient.city,
        recipientState: recipient.state,
        recipientComplement: recipient.complement || 'Não informado'
      }
    });
  }
}

export default new OrderMail();
