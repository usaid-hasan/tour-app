export default class SidebarBtn {
  constructor(btnElement) {
    this.sidebarBtn = btnElement;
    this.svgIcon = btnElement.querySelector('use');

    btnElement.addEventListener('click', () => this.#onClick());
  }

  #onClick() {
    if (document.body.classList.contains('open-sidebar')) {
      document.body.classList.remove('open-sidebar');
      this.svgIcon.setAttribute('href', '/icons.svg#menu');
    } else {
      document.body.classList.add('open-sidebar');
      this.svgIcon.setAttribute('href', '/icons.svg#close');
    }
  }
}
