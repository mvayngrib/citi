
const createCiti = require('./')
const citi = createCiti({
  client_id: '87972cc0-bf35-430e-b405-4fdf1599c3bc',
  client_secret: 'P0iD0wE3tC0dH5dW3cD8jJ3pY7fY2kD8aF4jB5iJ4sB3iV8fF2',
  db: './citi.db'
})

citi.applications(function (err, apps) {
  if (err) throw err

  const firstId = Object.keys(apps)[0]
  if (firstId) {
    return continueApplication(apps[firstId])
  }

  newApplication(function (err, application) {
    if (err) throw err

    continueApplication(application)
  })
})

function continueApplication (application) {
  citi.screenUnsecuredCreditApplication(application.applicationId, function (err, result) {
    if (err) throw err

    switch (result.applicationStage) {
    case 'PRESCREENING':
      return citi.requestCreditApplicationDecision(application.applicationId, function (err, result) {
        console.log(arguments)
      })
    case 'APPROVAL':
      return
    default:
      return
    }
  })
}

function newApplication (cb) {

// citi.products(function (err, products) {
//   const product = products[0]
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
    cb(err, data)
  })
}
