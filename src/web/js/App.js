/* eslint-disable no-new */
import Client from './Client';
import { BookTourBtn, DeleteUserBtn, LogoutBtn, ReviewBtn, SidebarBtn } from './components/button';
import { ImageSlider, MapContainer, ReviewContainer } from './components/container';
import { AlertDialog, UserPanelDialog } from './components/dialog';
import { Form, ImgInput } from './components/form';

class App {
  constructor(root) {
    const alertDialog = root.querySelector('#dialog-alert');
    const logoutBtn = root.querySelector('#btn-logout');
    const bookTourBtn = root.querySelector('#btn-book-tour');
    const sidebarMenuBtn = root.querySelector('#btn-sidebar-menu');
    const deleteUserBtn = root.querySelector('#btn-close-account');
    const reviewBtn = root.querySelector('#btn-open-review');
    const userPanelDialog = root.querySelector('#dialog-user-panel');
    const mapContainer = root.querySelector('#container-map');
    const reviewContainer = root.querySelector('#container-reviews');
    const slider = root.querySelector('#slider');
    const imgFileInput = root.querySelector('input[type="file"][name="photo"]');

    this.alert = new AlertDialog(alertDialog);
    this.api = new Client('/api/v1');

    if (document.forms.length) for (const form of document.forms) new Form(form, this.api, this.alert);

    if (logoutBtn) new LogoutBtn(logoutBtn, this.api, this.alert);
    if (bookTourBtn && typeof Stripe !== 'undefined') new BookTourBtn(bookTourBtn, this.api, this.alert);
    if (sidebarMenuBtn) new SidebarBtn(sidebarMenuBtn);
    if (deleteUserBtn) new DeleteUserBtn(deleteUserBtn);
    if (reviewBtn) new ReviewBtn(reviewBtn);
    if (userPanelDialog) new UserPanelDialog(userPanelDialog);
    if (reviewContainer) new ReviewContainer(reviewContainer);
    if (mapContainer) new MapContainer(mapContainer);
    if (slider) new ImageSlider(slider);
    if (imgFileInput) new ImgInput(imgFileInput);
  }
}

const init = () => new App(document);

window.addEventListener('load', init, { once: true });
