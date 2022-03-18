const fetch = require('node-fetch');
const factors = require('./emissionFactors');

module.exports = async function (context, req) {
	if (req.method === 'POST') {
		// The emission factor.
		const factor = req.body?.factor;

		// By default, the values sent over by the form are strings. We convert it to a floating-point number here.
		let money = parseFloat(req.body?.money);
		let unit = req.body?.unit;

		// Check if the factor is among the ones we have selected or not.
		if (!factors.includes(factor)) {
			context.res = {
				status: 400,
				body: JSON.stringify({ error: 'Invalid Emission Factor!' }),
				headers: {
					'Content-Type': 'application/json'
				}
			};
			return undefined;
		}

		// Calculation API only supports 3 currencies. To use others, we have to convert the currency first before sending the second API call.
		if (!['USD', 'EUR', 'GBP'].includes(unit)) {
			// Fetch the latest currency exchange information.
			const conversion = await fetch(
				`https://openexchangerates.org/api/latest.json?app_id=${process.env.OPENEXCHANGE_KEY}`
			).then(res => res.json());

			// Check whether we received the correct data.
			if (conversion.base === 'USD') {
				// Get the conversion rate for the selected unit.
				const rate = conversion.rates[unit];

				// Convert currency to USD.
				money = parseFloat(money / rate);
				unit = 'usd';
			} else {
				// In case of an error, we return a 500 status code and end this function.
				context.res = {
					status: 500,
					body: JSON.stringify({ error: 'Something went wrong!' }),
					headers: {
						'Content-Type': 'application/json'
					}
				};
				return undefined;
			}
		} else {
			// For supported units, we just need their lowercase version that's needed by the calculation API.
			unit = unit.toLowerCase();
		}

		// Get the data from the calculation API...
		const data = await fetch('https://beta3.api.climatiq.io/estimate', {
			method: 'POST',
			body: JSON.stringify({
				emission_factor: factor,
				// Reasonable defaults - 100 USD.
				parameters: { money: money || 100, money_unit: unit || 'usd' }
			}),
			headers: {
				Authorization: `Bearer ${process.env.CLIMATIQ_KEY}`,
				'Content-Type': 'application/json'
			}
		}).then(res => res.json());

		// ... and forward the same through the response.
		context.res = {
			status: 200,
			body: data,
			headers: {
				'Content-Type': 'application/json'
			}
		};
		return undefined;
	} else {
		// We are only using POST requests. Block all other types.
		context.res = {
			status: 405,
			headers: { Allow: 'POST' },
			body: 'Unsupported request method.'
		};
		return undefined;
	}
};
