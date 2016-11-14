
const createCiti = require('./')
const citi = createCiti({
  client_id: '87972cc0-bf35-430e-b405-4fdf1599c3bc',
  client_secret: 'P0iD0wE3tC0dH5dW3cD8jJ3pY7fY2kD8aF4jB5iJ4sB3iV8fF2',
  db: './citi.db'
})

citi.products(function (err, products) {
  const product = products[0]
  citi.createUnsecuredCreditApplication({
    productType: "creditCardProduct",
    "product": {
      "productCode": "VC830",
      "sourceCode": "WW5ARCE1",
      "organization": "888",
      "logo": "830"
    },
    "applicant": {
      "name": {
        "salutation": "MR",
        "givenName": "Ramkumar",
        "surname": "Singh"
      },
      "phone": [
        {
          "phoneType": "PRIMARY_MOBILE_NUMBER",
          "phoneCountryCode": "65",
          "phoneNumber": "98778535"
        }
      ],
      "email": [
        {
          "emailAddress": "damodar.nagamalli@citi.com"
        }
      ],
      "consentDetails": [
        {
          "consentType": "PDP_CONSENT",
          "isConsentGiven": "true"
        },
        {
          "consentType": "PARTNER_CONSENT",
          "isConsentGiven": "true"
        }
      ]
    }
    // product,
    // productType: 'creditCardProduct',
    // applicant: {
    //   name: {
    //     salutation: 'MR',
    //     givenName: 'Billy',
    //     surname: 'Bob'
    //   }
    // }
  }, function (err, data) {
    console.log(err || data)
  })
})
