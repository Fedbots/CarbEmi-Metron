// Enable bootstrap popovers globally.
const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
const popoverList = popoverTriggerList.map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));

// Form handling.
const form = document.querySelector('#calc');
form.addEventListener('submit', async e => {
	e.preventDefault();
	const factor = e.target.factor.value;
	const money = e.target.money.value;
	const unit = e.target.currency.value;

	const data = await fetch('/api/estimate', {
		method: 'POST',
		body: JSON.stringify({ factor, money, unit })
	}).then(res => res.json());

	document.querySelector('#calculated').innerHTML = `${data.co2e.toFixed(2)} ${data.co2e_unit} carbon emitted!`;
});

// Handle currency section.
(async () => {
	// Fetch and cache currency info.
	let currencies = JSON.parse(window.localStorage.getItem('currencies')) || [];
	if (!currencies?.length) {
		const data = await fetch('https://openexchangerates.org/api/currencies.json').then(res => res.json());
		for (const key in data) {
			currencies.push({ value: key, text: data[key] });
		}
		window.localStorage.setItem('currencies', JSON.stringify(currencies));
	}

	// Add currencies to the select list.
	const select = document.querySelector('select[name=currency]');
	for (const { value } of currencies) {
		const opt = document.createElement('option');
		opt.value = value;
		opt.text = value;
		select.add(opt);
	}

	// Add currency name as a popover. Change the popover whenever the selected currency is changed.
	select.addEventListener('change', e => {
		const info = document.querySelector('#currency-info');
		const value = e.target.value;
		const currency = currencies.find(c => c.value === value);

		new bootstrap.Popover(info, {
			container: 'body',
			content: currency.text,
			placement: 'right',
			trigger: 'hover focus'
		});
	});
})();
