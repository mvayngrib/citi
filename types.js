
const typeforce = require('typeforce')

const productTypes = [
  'readyCreditProduct',
  'unsecuredLoanProduct',
  'creditCardProduct'
]

exports.productType = function (val) {
  return productTypes.indexOf(val) !== -1
}

exports.product = typeforce.compile({
  productCode: typeforce.String,
  sourceCode: typeforce.maybe(typeforce.String),
  organization: typeforce.maybe(typeforce.String),
  logo: typeforce.maybe(typeforce.String)
})

exports.name = typeforce.compile({
  salutation: typeforce.String,
  givenName: typeforce.String,
  surname: typeforce.String
})

exports.phone = typeforce.compile({
  phoneType: oneOf('PRIMARY_MOBILE_NUMBER'),
  phoneCountryCode: typeforce.String,
  phoneNumber: typeforce.String
})

exports.email = typeforce.compile({
  emailAddress: typeforce.String
})

exports.consentDetails = typeforce.compile({
  consentType: oneOf('PDP_CONSENT', 'PARTNER_CONSENT'),
  isConsentGiven: oneOf('true', 'false')
})

exports.applicant = typeforce.compile({
  name: exports.name,
  phone: typeforce.arrayOf(exports.phone),
  email: typeforce.arrayOf(exports.email),
  consentDetails: typeforce.arrayOf(exports.consentDetails)
})

function oneOf (...vals) {
  return function (val) {
    return vals.indexOf(val) !== -1
  }
}
