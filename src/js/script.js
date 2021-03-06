// Enable bootstrap popovers globally.
const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
const popoverList = popoverTriggerList.map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));

// Form handling.
const form = document.querySelector('#calc');
form.addEventListener('submit', async e => {
	// Prevent form submission to automatically redirect to a random page.
	e.preventDefault();

	// Disable the calculate button temporarily.
	document.querySelector('form>button[type=submit]').disabled = true;

	// Add the html for the loading spinner.
	const result = document.querySelector('#calculated');
	result.innerHTML = `
	<div class="d-flex align-items-center justify-content-evenly">
		<div class="spinner-border" role="status"></div>
		<span class="d-block">Calculating...</span>
	</div>
	`;

	// Get the parameters from the form submission.
	const factor = e.target.factor.value;
	const money = e.target.money.value;
	const unit = e.target.currency.value;

	try {
		// Hit our custom API endpoint and get new data.
		const data = await fetch('https://cemetron-api.azurewebsites.net/api/estimate', {
			method: 'POST',
			body: JSON.stringify({ factor, money, unit })
		}).then(res => res.json());

		if (data.co2e >= 0) {
			// Insert the calculated results into the results area.
			result.innerHTML = `Based on the above parameters, ${data.co2e.toFixed(2)} ${
				data.co2e_unit
			} of carbon will be emitted!`;
		} else {
			throw new Error('Something went wrong!');
		}
	} catch {
		const toast = new bootstrap.Toast(document.querySelector('#error-toast'));
		toast.show();
	}

	// Enable the calculate button again.
	document.querySelector('form>button[type=submit]').disabled = false;
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
