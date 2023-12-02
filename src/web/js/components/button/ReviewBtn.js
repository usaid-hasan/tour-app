import ReviewDialog from '../dialog/ReviewDialog';

export default class ReviewBtn {
  constructor(btnElement) {
    this.reviewBtn = btnElement;

    this.reviewDialog = new ReviewDialog(document.querySelector('#dialog-review'));

    this.reviewBtn.addEventListener('click', () => this.reviewDialog.showDialog());
  }
}
