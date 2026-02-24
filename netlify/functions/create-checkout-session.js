const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, customerEmail, customerName, customerPhone, customerAddress } = JSON.parse(event.body);
    
    // Créer les line items pour Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.options && item.options.length > 0 
            ? 'Options: ' + item.options.map(o => o.name).join(', ')
            : undefined,
        },
        unit_amount: Math.round(item.unitPrice * 100), // Stripe utilise les centimes
      },
      quantity: item.quantity,
    }));

    // Calculer les frais de transport
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    let transportPercent = 0.05;
    if (subtotal <= 100) transportPercent = 0.30;
    else if (subtotal <= 250) transportPercent = 0.20;
    else if (subtotal <= 500) transportPercent = 0.15;
    else if (subtotal <= 1000) transportPercent = 0.10;
    else if (subtotal <= 2000) transportPercent = 0.08;
    else if (subtotal <= 4000) transportPercent = 0.06;
    
    const transportAmount = Math.round(subtotal * transportPercent);
    
    // Ajouter les frais de transport
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Frais de transport',
          description: `${Math.round(transportPercent * 100)}% du montant HT`,
        },
        unit_amount: Math.round(transportAmount * 100),
      },
      quantity: 1,
    });

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${event.headers.origin}/boutique.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin}/boutique.html?canceled=true`,
      customer_email: customerEmail,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['FR'],
      },
      metadata: {
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
      },
      locale: 'fr',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
