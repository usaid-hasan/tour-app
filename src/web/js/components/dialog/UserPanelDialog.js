export default class UserPanelDialog {
  constructor(dialogElement) {
    this.userPanel = dialogElement;
    this.open = dialogElement.open;
    this.focused = dialogElement.querySelector('.user-panel__listitem');

    const userPanelBtn = document.querySelector('#btn-user-panel');
    userPanelBtn.addEventListener('click', () => this.togglePanel());

    dialogElement.addEventListener('focusout', () => this.#onFocusOut());
    dialogElement.addEventListener('keydown', (e) => this.#onKeyDown(e));
  }

  #onFocusOut() {
    if (!this.userPanel.matches(':hover, :focus-within')) this.closeDialog();
  }

  #onKeyDown(e) {
    if (e.key === 'ArrowDown' && this.focused.nextElementSibling) {
      e.preventDefault();
      this.focused.nextElementSibling.firstElementChild.focus();
      this.focused = this.focused.nextElementSibling;
    }
    if (e.key === 'ArrowUp' && this.focused.previousElementSibling) {
      e.preventDefault();
      this.focused.previousElementSibling.firstElementChild.focus();
      this.focused = this.focused.previousElementSibling;
    }
    if (e.key === 'Escape') {
      this.closeDialog();
    }
  }

  togglePanel() {
    if (this.open) this.closeDialog();
    else this.showDialog();
  }

  showDialog() {
    this.userPanel.show();
    this.userPanel.focus();
  }

  closeDialog() {
    this.userPanel.close();
  }
}
