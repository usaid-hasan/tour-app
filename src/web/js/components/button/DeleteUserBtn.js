import ConfirmationDialog from '../dialog/ConfirmationDialog';

export default class DeleteUserBtn {
  constructor(btnElement) {
    this.deleteUserBtn = btnElement;

    this.confirmationDialog = new ConfirmationDialog(document.querySelector('#dialog-confirmation'));

    this.deleteUserBtn.addEventListener('click', () => this.confirmationDialog.showDialog());
  }
}
