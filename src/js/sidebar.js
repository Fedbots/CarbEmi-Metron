/* Usually, you put this after a ready or a load event, but since we are loading this javascript file in the body section,
	we can safely assume that the DOM is ready for manipulation. */

const sidebar = document.querySelector('#sidebar');
const overlay = document.querySelector('.overlay');
const collapse = document.querySelector('#sidebarCollapse');

sidebar.addEventListener('click', () => {
	sidebar.classList.remove('active');
	overlay.classList.remove('active');
});

collapse.addEventListener('click', () => {
	sidebar.classList.add('active');
	overlay.classList.add('active');
});
