let containerNav = document.querySelector('.container-nav')
function toggleNav() {
    containerNav.classList.toggle('hide')
    document.querySelector('.container-nav-toggle').classList.toggle('dropend')
    document.querySelector('.container-nav-toggle').classList.toggle('dropstart')
}
document.querySelector('#nav-toggle').addEventListener('click', toggleNav)