   // Highlight the active dot
   const dots = document.querySelectorAll('.dot');
   const sections = document.querySelectorAll('[id^="section"]');

   window.addEventListener('scroll', () => {
       let current = '';

       sections.forEach(section => {
           const sectionTop = section.offsetTop - 100;
           if (scrollY >= sectionTop) {
               current = section.getAttribute('id');
           }
       });

       dots.forEach(dot => {
           dot.classList.remove('bg-blue-400', 'border-blue-400');
           if (dot.getAttribute('href') === `#${current}`) {
               dot.classList.add('bg-blue-400', 'border-blue-400');
           }
       });
   });

   