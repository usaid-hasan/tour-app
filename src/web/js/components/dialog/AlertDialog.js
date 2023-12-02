export default class AlertDialog {
  constructor(dialogElement) {
    this.alertDialog = dialogElement;

    if (this.alertDialog.dataset.alert) {
      const { alertType, alertTime } = this.alertDialog.dataset;
      this.showAlert(alertType, null, alertTime);
    }
  }

  showAlert(type, message, time) {
    if (message) this.alertDialog.textContent = message;

    this.alertDialog.classList.add(`alert--${type}`);
    this.alertDialog.showModal();

    setTimeout(() => this.hideAlert(), time * 1000);
  }

  hideAlert() {
    this.alertDialog.close();
    this.alertDialog.textContent = '';
    this.alertDialog.classList.remove('alert--error', 'alert--success');
  }
}
