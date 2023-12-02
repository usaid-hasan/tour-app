export default class BookTourBtn {
  constructor(btnElement, api, alert) {
    this.bookTourBtn = btnElement;
    this.api = api;
    this.alert = alert;

    // eslint-disable-next-line new-cap
    this.stripe = Stripe(btnElement.dataset.stripeKey);

    btnElement.addEventListener('click', (e) => this.#onClick(e));
  }

  async #onClick() {
    this.bookTourBtn.classList.add('btn--spinner');

    const { tourId } = this.bookTourBtn.dataset;
    try {
      const res = await this.api.send({ path: `/bookings/checkout-session/${tourId}`, method: 'GET' });
      const json = await res.json();

      if (res.ok) {
        this.alert.showAlert('success', json.message, 2.8);
        setTimeout(() => this.stripe.redirectToCheckout({ sessionId: json.data.session.id }), 3 * 1000);
      } else {
        this.alert.showAlert('error', json.message, 2.5);
      }
    } catch (err) {
      this.alert.showAlert('error', 'There was a network problem', 2);
    }

    this.bookTourBtn.classList.remove('btn--spinner');
  }
}
