/* eslint-disable dot-notation */
export default class ReviewDialog {
  constructor(dialogElement) {
    this.reviewDialog = dialogElement;
    this.form = dialogElement.querySelector('form');
    const cancelBtn = dialogElement.querySelector('button[value="cancel"]');

    cancelBtn.addEventListener('click', (e) => this.closeDialog(e));
  }

  showDialog() {
    this.reviewDialog.showModal();
    this.form.elements['review'].blur();
  }

  closeDialog(e) {
    e.preventDefault();
    this.reviewDialog.close();
  }

  populate(reviewBox) {
    const { reviewId, stars, tourId } = reviewBox.dataset;

    this.form.setAttribute('data-review-id', reviewId);
    this.form.elements['review'].textContent = reviewBox.querySelector('blockquote p').textContent;
    this.form.elements['review'].select();

    this.form.elements['rating'].value = stars;
    this.form.elements['tour'].value = tourId;

    this.showDialog();
  }
}
