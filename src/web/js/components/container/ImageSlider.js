export default class Slider {
  constructor(slider, currentSlide = 1) {
    this.slider = slider;
    this.currentSlide = currentSlide;
    this.slideContainer = slider.firstElementChild;
    this.maxSlide = this.slideContainer.children.length;
    this.dots = slider.lastElementChild;

    this.dots.addEventListener('click', (e) => {
      if (e.target.classList.contains('slider__dot')) this.goToSlide(Number(e.target.dataset.slide));
    });

    const sliderLeftBtn = slider.querySelector('#btn-left-slide');
    const sliderRightBtn = slider.querySelector('#btn-right-slide');

    sliderLeftBtn.addEventListener('click', () => this.prevSlide());
    sliderRightBtn.addEventListener('click', () => this.nextSlide());

    this.#activateDot(currentSlide);
  }

  nextSlide() {
    const slide = (this.currentSlide === this.maxSlide) ? 1 : Number(this.currentSlide) + 1;
    this.goToSlide(slide);
  }

  prevSlide() {
    const slide = (this.currentSlide === 1) ? this.maxSlide : Number(this.currentSlide) - 1;
    this.goToSlide(slide);
  }

  goToSlide(slide) {
    this.currentSlide = slide;
    this.#activateDot(slide);
    this.slideContainer.style.transform = `translateX(${-100 * (slide - 1)}%)`;
  }

  #activateDot(slide) {
    for (const dot of this.dots.children) dot.classList.remove('slider__dot--active');
    this.dots.querySelector(`.slider__dot[data-slide="${slide}"]`).classList.add('slider__dot--active');
  }
}
