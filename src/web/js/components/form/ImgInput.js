export default class ImgInput {
  constructor(inputElement) {
    this.imgFileInput = inputElement;
    this.img = document.querySelector('.form__user-photo');

    inputElement.addEventListener('change', (e) => this.#onChange(e));
  }

  #onChange(e) {
    const file = e.currentTarget.files[0];
    if (file) this.img.src = URL.createObjectURL(file);
  }
}
