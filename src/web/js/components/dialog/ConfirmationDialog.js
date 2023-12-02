export default class ConfirmationDialog {
  constructor(dialogElement) {
    this.confirmationDialog = dialogElement;
    this.form = dialogElement.querySelector('form');
    const cancelBtn = dialogElement.querySelector('button[value="cancel"]');

    cancelBtn.addEventListener('click', (e) => this.closeDialog(e));
  }

  showDialog() {
    this.confirmationDialog.showModal();
  }

  closeDialog(e) {
    e.preventDefault();
    this.confirmationDialog.close();
  }

  populate(reviewId) {
    this.form.setAttribute('data-review-id', reviewId);
    this.showDialog();
  }
}
