export default class Form {
  constructor(formElement, api, alert) {
    this.form = formElement;
    this.formBtn = formElement.querySelector(':where(.btn.form__btn)');
    this.api = api;
    this.alert = alert;

    formElement.addEventListener('submit', (e) => this.#onSubmit(e));
  }

  async #onSubmit(e) {
    e.preventDefault();

    const { options, redirect } = this.#getRequestOptions(this.form.getAttribute('id'));

    if (options.formData) {
      const { formData: f } = options;
      if (f.has('passwordConfirm')) {
        if (f.get('password') !== f.get('passwordConfirm')) {
          this.alert.showAlert('error', 'Passwords do not match', 1.6);
          return;
        }
        f.delete('passwordConfirm');
      }

      if (f.has('photo') && f.get('photo').size === 0) f.delete('photo');
    }

    this.formBtn?.classList.add('btn--spinner');

    try {
      const res = await this.api.send(options);
      const json = await res.json();

      if (res.ok) {
        this.alert.showAlert('success', json.message, 2.5);
        if (redirect) setTimeout(redirect, 2.7 * 1000);
      } else {
        this.alert.showAlert('error', json.message, 2.5);
      }
    } catch (err) {
      this.alert.showAlert('error', 'There was a network problem', 2);
    }

    this.formBtn?.classList.remove('btn--spinner');
  }

  #getRequestOptions(id) {
    let options = null,
        redirect = null;

    switch (id) {
      case 'form-login':
        options = { path: '/users/login', method: 'POST', formData: new FormData(this.form) };
        redirect = () => location.assign('/account');
        break;
      case 'form-signup':
        options = { path: '/users/signup', method: 'POST', formData: new FormData(this.form) };
        redirect = () => location.assign('/account');
        break;
      case 'form-update-profile':
        options = { path: '/users/update-profile', method: 'PATCH', type: 'enctype', formData: new FormData(this.form) };
        redirect = () => location.reload();
        break;
      case 'form-update-password':
        options = { path: '/users/update-password', method: 'PATCH', formData: new FormData(this.form) };
        redirect = () => location.reload();
        break;
      case 'form-forgot-password':
        options = { path: '/users/forgot-password', method: 'POST', formData: new FormData(this.form) };
        break;
      case 'form-reset-password':
        options = { path: `/users/reset-password/${location.hash.slice(1)}`, method: 'PATCH', formData: new FormData(this.form) };
        redirect = () => location.assign('/account');
        break;
      case 'form-post-review':
        options = { path: '/reviews', method: 'POST', formData: new FormData(this.form) };
        redirect = () => location.reload();
        break;
      case 'form-update-review':
        options = { path: `/reviews/${this.form.dataset.reviewId}`, method: 'PATCH', formData: new FormData(this.form) };
        redirect = () => location.reload();
        break;
      case 'form-delete-review':
        options = { path: `/reviews/${this.form.dataset.reviewId}`, method: 'DELETE' };
        redirect = () => location.reload();
        break;
      case 'form-delete-profile':
        options = { path: '/users/delete-profile', method: 'DELETE' };
        redirect = () => location.assign('/');
        break;
      default:
        break;
    }

    return { options, redirect };
  }
}
