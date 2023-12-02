export default class LogoutBtn {
  constructor(btnElement, api, alert) {
    this.logoutBtn = btnElement;
    this.api = api;
    this.alert = alert;

    btnElement.addEventListener('click', () => this.#onClick());
  }

  async #onClick() {
    this.logoutBtn.classList.add('btn--spinner');

    try {
      const res = await this.api.send({ path: '/users/logout', method: 'GET' });
      const json = await res.json();

      if (res.ok) {
        this.alert.showAlert('success', json.message, 2);
        setTimeout(() => location.assign('/'), 2 * 1000);
      }
    } catch (err) {
      this.alert.showAlert('error', 'There was a network problem', 2);
    }

    this.logoutBtn.classList.remove('btn--spinner');
  }
}
