import ConfirmationDialog from '../dialog/ConfirmationDialog';
import ReviewDialog from '../dialog/ReviewDialog';

export default class ReviewContainer {
  constructor(reviewContainer) {
    this.reviewContainer = reviewContainer;

    const reviewDialog = document.querySelector('#dialog-review');

    if (reviewDialog) {
      this.reviewDialog = new ReviewDialog(reviewDialog);
      this.confirmationDialog = new ConfirmationDialog(document.querySelector('#dialog-confirmation'));
    }

    reviewContainer.addEventListener('click', (e) => this.#onClick(e));
  }

  #onClick(e) {
    const btn = e.target.closest('.review-box__btn');
    if (!btn) return;

    const { op } = btn.dataset;
    const reviewBox = btn.closest('.review-box');

    if (op === 'update') this.reviewDialog.populate(reviewBox);
    if (op === 'delete') this.confirmationDialog.populate(reviewBox.dataset.reviewId);
  }
}
