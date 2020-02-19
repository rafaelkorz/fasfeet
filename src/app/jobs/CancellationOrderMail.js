import Mail from '../../lib/Mail';

class CancellationOrderMail {
  get key() {
    return 'CancellationOrderMail';
  }

  async handle({ data }) {
    const { order, deliveryman, recipient } = data;

    await Mail.sendMail({
      to: `${deliveryman.name} <${deliveryman.email}>`,
      subject: `Detalhes da entrega`,
      template: 'cancelOrder',
      context: {
        prod: order.product,
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

export default new CancellationOrderMail();
