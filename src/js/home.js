
const flyoutMenu = document.getElementById('flyoutMenu');

function showFlyoutMenu() {
  flyoutMenu.classList.remove('hidden', 'opacity-0', 'translate-y-4', 'transition-leave');
  flyoutMenu.classList.add('transition-enter', 'opacity-100', 'translate-y-0');
}

function hideFlyoutMenu() {
  flyoutMenu.classList.remove('transition-enter', 'opacity-100', 'translate-y-0');
  flyoutMenu.classList.add('transition-leave', 'opacity-0', 'translate-y-4');
  setTimeout(() => {
    flyoutMenu.classList.add('hidden');
  }, 150); // Attendi il completamento della transizione
}
