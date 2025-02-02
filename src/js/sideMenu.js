// Get all the dots and their labels
const dotss = document.querySelectorAll('.dotss');
const labels = document.querySelectorAll('.dotss + span');

// Function to update active state
function updateActiveState() {
  const scrollPosition = window.scrollY;
  const sections = ['home', 'section1', 'section2', 'section3', 'section4', 'section5'];

  sections.forEach((sectionId, index) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const sectionTop = section.offsetTop - 300;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        dotss[index].classList.add('active');
        labels[index].classList.add('bg-white', 'text-black', 'transition-colors');
      } else {
        dotss[index].classList.remove('active');
        labels[index].classList.remove('bg-white', 'text-black', 'transition-colors');
      }
    }
  });
}

// Add scroll event listener
window.addEventListener('scroll', updateActiveState);

// Initial check
updateActiveState();